import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { phrases } from '../content/phrases'
import { speak, stopSpeech } from '../speech/speech'
import { useVoiceStatus } from '../speech/useVoiceStatus'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { CheckIcon, HouseIcon, SpeakerIcon } from '../ui/icons'
import type { ChoiceQuestion, ChoiceRound } from './choiceQuestion'
import { RoundComplete } from './RoundComplete'
import { RoundProgress } from './RoundProgress'
import { advance, choose, currentQuestion, isAnswerRevealed, startRound, type RoundState } from './roundState'
import styles from './ChoiceChallenge.module.css'

/** The green "correct" card stays at least this long, even when there is no voice to wait for. */
const CORRECT_PAUSE_MS = 900

export interface ChoiceChallengeProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  /** Said when a question starts and when the speaker is pressed: "Var är A?" */
  ask: (question: Q) => string
  /** Said once only the answer is left: "Här är A!" */
  reveal: (question: Q) => string
  /** Names a wrong choice the child tapped: "Det där är S." */
  nameChoice: (choice: string) => string
  /** Said on the end-of-round screen. */
  complete: string
  choiceKind: 'letter' | 'picture'
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a choice button (also used by tests). */
  choiceLabel: (choice: string) => string
  /** Shown above the choices, e.g. the picture in Första bokstaven. Tapping it repeats the question. */
  showcase?: (question: Q) => ReactNode
  /** Shown next to the speaker when there is no Swedish voice, so the question can still be seen. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * Everything the challenges share: asking out loud, graduated help after a
 * wrong tap, praise, progress stars, keyboard support and the end screen.
 */
export function ChoiceChallenge<Q extends ChoiceQuestion>({
  round,
  ask,
  reveal,
  nameChoice,
  complete,
  choiceKind,
  renderChoice,
  choiceLabel,
  showcase,
  silentPrompt,
  onExit,
  onPlayAgain,
}: ChoiceChallengeProps<Q>) {
  const [state, setState] = useState(() => startRound(round))
  const voiceStatus = useVoiceStatus()
  const choicesRef = useRef<HTMLDivElement>(null)

  const question = currentQuestion(state)
  const revealed = isAnswerRevealed(state)
  const questionText = question ? ask(question) : null

  function promptFor(s: RoundState<Q>): string {
    const q = currentQuestion(s)
    if (!q) return ''
    return isAnswerRevealed(s) ? reveal(q) : ask(q)
  }

  // Ask each new question out loud.
  useEffect(() => {
    if (questionText) void speak(questionText)
  }, [questionText])

  // Stop talking when the child leaves.
  useEffect(() => stopSpeech, [])

  // After a correct answer: praise, then the next question.
  useEffect(() => {
    if (state.phase !== 'correct') return
    let cancelled = false
    const praise = phrases.praise[state.questionIndex % phrases.praise.length] ?? phrases.praise[0]
    void Promise.all([speak(praise), pause(CORRECT_PAUSE_MS)]).then(() => {
      if (!cancelled) setState(advance)
    })
    return () => {
      cancelled = true
    }
  }, [state.phase, state.questionIndex])

  function handleChoose(choice: string) {
    const next = choose(state, choice)
    if (next === state) return
    setState(next)
    if (next.phase === 'asking') {
      // Wrong: name what they tapped, then ask again (or point at the answer once it is the only one left).
      void speak(`${nameChoice(choice)} ${promptFor(next)}`)
    }
  }

  function handleReplay() {
    if (state.phase === 'asking') void speak(promptFor(state))
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question) return
    const number = Number(event.key)
    const choice = question.choices[number - 1]
    if (Number.isInteger(number) && number >= 1 && choice) {
      handleChoose(choice)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocus(choicesRef.current, event.key === 'ArrowRight' ? 1 : -1)
    }
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (state.phase === 'finished' || !question) {
    return <RoundComplete message={complete} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  return (
    <main className={cx(styles.screen, showcase && styles.withShowcase)}>
      <div className={styles.topBar}>
        <RoundButton label="Till menyn" onClick={handleExit}>
          <HouseIcon />
        </RoundButton>
        <div className={styles.prompt}>
          <RoundButton label="Lyssna igen" size="large" onClick={handleReplay}>
            <SpeakerIcon />
          </RoundButton>
          {voiceStatus === 'missing' && silentPrompt && (
            <span className={styles.silentPrompt}>{silentPrompt(question)}</span>
          )}
        </div>
        <RoundProgress total={state.round.questions.length} current={state.questionIndex} />
      </div>

      <div className={styles.body}>
        {showcase && (
          <button type="button" className={styles.showcase} aria-label="Lyssna på ordet" onClick={handleReplay}>
            {showcase(question)}
          </button>
        )}

        <div className={styles.choices} ref={choicesRef}>
          {question.choices.map((id) => {
            const isAnswer = id === question.target
            const isCorrect = state.phase === 'correct' && isAnswer
            const isRemoved = state.removed.includes(id)
            return (
              <button
                key={`${state.questionIndex}-${id}`}
                type="button"
                className={cx(
                  styles.card,
                  choiceKind === 'picture' && styles.pictureCard,
                  isRemoved && styles.removed,
                  isCorrect && styles.correct,
                  state.phase === 'correct' && !isAnswer && styles.faded,
                  state.phase === 'asking' && revealed && isAnswer && styles.reveal,
                )}
                aria-label={choiceLabel(id)}
                disabled={isRemoved}
                onClick={() => handleChoose(id)}
              >
                {renderChoice(id)}
                {isCorrect && (
                  <span className={styles.badge}>
                    <CheckIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <p className={styles.seed}>#{state.round.seed}</p>
    </main>
  )
}

function moveFocus(container: HTMLElement | null, step: 1 | -1) {
  if (!container) return
  const buttons = [...container.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')]
  if (buttons.length === 0) return
  const index = buttons.findIndex((button) => button === document.activeElement)
  const next = index === -1 ? (step === 1 ? 0 : buttons.length - 1) : (index + step + buttons.length) % buttons.length
  buttons[next]?.focus()
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
