import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { phrases } from '../../content/phrases'
import { speak, stopSpeech } from '../../speech/speech'
import { useVoiceStatus } from '../../speech/useVoiceStatus'
import { RoundButton } from '../../ui/RoundButton'
import { cx } from '../../ui/cx'
import { CheckIcon, HouseIcon, SpeakerIcon } from '../../ui/icons'
import { RoundComplete } from '../RoundComplete'
import { RoundProgress } from '../RoundProgress'
import { createFindLetterRound } from './createRound'
import {
  advance,
  choose,
  currentQuestion,
  isAnswerRevealed,
  startFindLetter,
  type FindLetterState,
} from './roundState'
import styles from './FindLetter.module.css'

/** The green "correct" card stays at least this long, even when there is no voice to wait for. */
const CORRECT_PAUSE_MS = 900

interface FindLetterProps {
  seed: number
  onExit: () => void
  onPlayAgain: () => void
}

/** Hitta bokstaven: hear "Var är A?" and tap the letter. */
export function FindLetter({ seed, onExit, onPlayAgain }: FindLetterProps) {
  const [state, setState] = useState(() =>
    startFindLetter(createFindLetterRound({ seed, letters, confusables: confusableLetters })),
  )
  const voiceStatus = useVoiceStatus()
  const choicesRef = useRef<HTMLDivElement>(null)

  const question = currentQuestion(state)
  const revealed = isAnswerRevealed(state)
  const questionText = question ? phrases.findLetterQuestion(getLetter(question.target).spoken) : null

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
      // Wrong: name the letter they tapped, then ask again (or point at the answer once it is the only one left).
      void speak(`${phrases.thatIs(getLetter(choice).spoken)} ${promptFor(next)}`)
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
    return <RoundComplete message={phrases.findLetterComplete} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <RoundButton label="Till start" onClick={handleExit}>
          <HouseIcon />
        </RoundButton>
        <div className={styles.prompt}>
          <RoundButton label="Lyssna igen" size="large" onClick={handleReplay}>
            <SpeakerIcon />
          </RoundButton>
          {voiceStatus === 'missing' && (
            // Without a Swedish voice the question can't be heard, so show which letter to find instead.
            <span className={styles.promptLetter}>{getLetter(question.target).display}</span>
          )}
        </div>
        <RoundProgress total={state.round.questions.length} current={state.questionIndex} />
      </div>

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
                isRemoved && styles.removed,
                isCorrect && styles.correct,
                state.phase === 'correct' && !isAnswer && styles.faded,
                state.phase === 'asking' && revealed && isAnswer && styles.reveal,
              )}
              disabled={isRemoved}
              onClick={() => handleChoose(id)}
            >
              {getLetter(id).display}
              {isCorrect && (
                <span className={styles.badge}>
                  <CheckIcon />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className={styles.seed}>#{seed}</p>
    </main>
  )
}

/** What the speaker button repeats: the question, or "Här är A!" once only the answer is left. */
function promptFor(state: FindLetterState): string {
  const question = currentQuestion(state)
  if (!question) return ''
  const letter = getLetter(question.target).spoken
  return isAnswerRevealed(state) ? phrases.hereIs(letter) : phrases.findLetterQuestion(letter)
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
