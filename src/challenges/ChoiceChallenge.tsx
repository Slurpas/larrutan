import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { phrases } from '../content/phrases'
import type { RoundOutcome } from '../rewards/progress'
import { speak, stopSpeech } from '../speech/speech'
import { useVoiceStatus } from '../speech/useVoiceStatus'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { CheckIcon, HouseIcon, SpeakerIcon } from '../ui/icons'
import type { ChoiceQuestion, ChoiceRound } from './choiceQuestion'
import type { Difficulty } from './difficulty'
import { RoundComplete } from './RoundComplete'
import { RoundProgress } from './RoundProgress'
import { advance, choose, currentQuestion, isAnswerRevealed, startRound, type RoundState } from './roundState'
import type { ChallengeVoice } from './voices'
import styles from './ChoiceChallenge.module.css'

/** The green "correct" card stays at least this long, even when there is no voice to wait for. */
const CORRECT_PAUSE_MS = 900

export interface ChoiceChallengeProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  /** What the challenge says (src/challenges/voices.ts). */
  voice: ChallengeVoice<Q>
  difficulty: Difficulty
  /** How many difficulty levels this challenge has, for the level pips. */
  difficultyCount: number
  /** Called once when the last question is answered; returns what the round earned. */
  onRoundComplete?: (wrongTaps: number) => RoundOutcome
  /** The child has finished this challenge before, so even the first question can be the short form. */
  knowsChallenge?: boolean
  choiceKind: 'letter' | 'picture'
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a choice button (also used by tests). */
  choiceLabel: (choice: string) => string
  /** Shown above the choices, e.g. the picture in Första bokstaven. Tapping it says the short form again. */
  showcase?: (question: Q) => ReactNode
  /** Shown next to the speaker when there is no Swedish voice, so the question can still be seen. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * Everything the challenges share: asking out loud, graduated help after a
 * wrong tap, a happy sound for right answers, progress stars, keyboard support
 * and the end screen.
 */
export function ChoiceChallenge<Q extends ChoiceQuestion>({
  round,
  voice,
  difficulty,
  difficultyCount,
  onRoundComplete,
  knowsChallenge = false,
  choiceKind,
  renderChoice,
  choiceLabel,
  showcase,
  silentPrompt,
  onExit,
  onPlayAgain,
}: ChoiceChallengeProps<Q>) {
  const [state, setState] = useState(() => startRound(round))
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const voiceStatus = useVoiceStatus()
  const choicesRef = useRef<HTMLDivElement>(null)

  const question = currentQuestion(state)
  const revealed = isAnswerRevealed(state)

  // The full question only until the child knows the game: the very first question they ever get here.
  // After that the short form, also after a wrong tap. The speaker button always gives the full question.
  const short = (q: Q) => (voice.askAgain ? voice.askAgain(q) : voice.ask(q))
  const useShort = knowsChallenge || state.questionIndex > 0
  const questionText = !question ? null : useShort ? short(question) : voice.ask(question)

  function promptFor(s: RoundState<Q>, full = false): string {
    const q = currentQuestion(s)
    if (!q) return ''
    if (isAnswerRevealed(s)) return voice.reveal(q)
    return full ? voice.ask(q) : short(q)
  }

  // Ask each new question out loud; a hard round starts by saying so.
  const isFirstQuestion = state.questionIndex === 0
  useEffect(() => {
    if (!questionText) return
    void speak(isFirstQuestion && difficulty === 'hard' ? [phrases.hardLevelIntro, questionText] : questionText)
  }, [questionText, isFirstQuestion, difficulty])

  // Stop talking when the child leaves.
  useEffect(() => stopSpeech, [])

  const finishRound = useEffectEvent(() => {
    if (onRoundComplete) setOutcome(onRoundComplete(state.wrongTaps))
  })

  // After a correct answer: a happy chime, then the next question (or the end of the round).
  useEffect(() => {
    if (state.phase !== 'correct') return
    let cancelled = false
    const isLast = state.questionIndex === state.round.questions.length - 1
    void Promise.all([speak({ sound: 'correct' }), pause(CORRECT_PAUSE_MS)]).then(() => {
      if (cancelled) return
      if (isLast) finishRound()
      setState(advance)
    })
    return () => {
      cancelled = true
    }
  }, [state.phase, state.questionIndex, state.round.questions.length])

  function handleChoose(choice: string) {
    const next = choose(state, choice)
    if (next === state) return
    setState(next)
    if (next.phase === 'asking') {
      // Wrong: name what they tapped, then ask again (or point at the answer once it is the only one left).
      void speak([voice.nameChoice(choice), promptFor(next)])
    }
  }

  /** The speaker button: the full question, for a child who needs to hear what to do. */
  function handleReplay() {
    if (state.phase === 'asking') void speak(promptFor(state, true))
  }

  /** Tapping the picture: just the word again. */
  function handleShowcaseTap() {
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
    return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  return (
    <main className={cx(styles.screen, showcase && styles.withShowcase)}>
      <div className={styles.topBar}>
        <RoundButton label="Till kartan" onClick={handleExit}>
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
        <div className={styles.status}>
          {difficultyCount > 1 && (
            <span
              className={styles.level}
              role="img"
              aria-label={difficulty === 'hard' ? 'Svår nivå' : 'Lätt nivå'}
            >
              {Array.from({ length: difficultyCount }, (_, i) => (
                <span key={i} className={cx(styles.pip, i <= (difficulty === 'hard' ? 1 : 0) && styles.pipOn)} />
              ))}
            </span>
          )}
          <RoundProgress total={state.round.questions.length} current={state.questionIndex} />
        </div>
      </div>

      <div className={styles.body}>
        {showcase && (
          <button type="button" className={styles.showcase} aria-label="Lyssna på ordet" onClick={handleShowcaseTap}>
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
