import { useEffectEvent, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { RoundOutcome } from '../rewards/progress'
import { stopSpeech } from '../speech/speech'
import { useVoiceStatus } from '../speech/useVoiceStatus'
import { cx } from '../ui/cx'
import { CheckIcon } from '../ui/icons'
import { ChallengeTopBar } from './ChallengeTopBar'
import type { ChoiceQuestion, ChoiceRound } from './choiceQuestion'
import type { Level } from './levels'
import { RoundComplete } from './RoundComplete'
import { useChoiceRound, type RoundResult } from './useChoiceRound'
import type { ChallengeVoice } from './voices'
import styles from './ChoiceChallenge.module.css'

/** The green "correct" card stays at least this long, even when there is no voice to wait for. */
const CORRECT_PAUSE_MS = 900

export interface ChoiceChallengeProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  /** What the challenge says (src/challenges/voices.ts). */
  voice: ChallengeVoice<Q>
  level: Level
  /** Said before the first question when the station has just gone up a level. */
  levelIntro?: string
  /** Called once when the last question is answered; returns what the round earned. */
  onRoundComplete?: (result: RoundResult) => RoundOutcome
  /** What a question practises, for mastery: the letter in Hitta bokstaven, the word in the others. */
  practiceItem: (question: Q) => string
  /** The child has finished this challenge before, so even the first question can be the short form. */
  knowsChallenge?: boolean
  choiceKind: 'letter' | 'picture'
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a choice button (also used by tests). */
  choiceLabel: (choice: string) => string
  /**
   * Shown above the choices, e.g. the written word in Ord och bild. Tapping it says the short form
   * again. `help`: how many wrong choices the child has tapped in this question, and whether it is solved.
   */
  showcase?: (question: Q, help: { wrongTaps: number; solved: boolean }) => ReactNode
  /** 'word': the showcase is a written word, as wide as it needs to be; 'scene': a picture as big as it needs to be (Räkna frukterna's fruit). */
  showcaseKind?: 'picture' | 'word' | 'scene'
  /** The choice a key picks (a number's own digit); by default keys 1–4 pick the choices in order. */
  keyChoice?: (key: string, question: Q) => string | undefined
  /** Shown next to the speaker when there is no Swedish voice, so the question can still be seen. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * The card screen: the choices as big cards to tap, with progress stars, keyboard
 * support and the end screen. Asking, help and rewards come from useChoiceRound.
 */
export function ChoiceChallenge<Q extends ChoiceQuestion>({
  round,
  voice,
  level,
  levelIntro,
  onRoundComplete,
  practiceItem,
  knowsChallenge = false,
  choiceKind,
  renderChoice,
  choiceLabel,
  showcase,
  showcaseKind = 'picture',
  silentPrompt,
  keyChoice = (key, q) => (/^[1-9]$/.test(key) ? q.choices[Number(key) - 1] : undefined),
  onExit,
  onPlayAgain,
}: ChoiceChallengeProps<Q>) {
  const { state, question, revealed, outcome, choose, replay, sayAgain } = useChoiceRound({
    round,
    voice,
    levelIntro,
    onRoundComplete,
    practiceItem,
    knowsChallenge,
    correctPauseMs: CORRECT_PAUSE_MS,
  })
  const voiceStatus = useVoiceStatus()
  const choicesRef = useRef<HTMLDivElement>(null)

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question) return
    const choice = keyChoice(event.key, question)
    if (choice) {
      choose(choice)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocus(choicesRef.current, event.key === 'ArrowRight' ? 1 : -1)
    }
  })

  // Before the screen is painted, so a key pressed the moment a question appears is never lost.
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (state.phase === 'finished' || !question) {
    return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  return (
    <main className={cx(styles.screen, question.choices.length > 3 && styles.fourChoices, showcase && styles.withShowcase)}>
      <ChallengeTopBar
        onExit={handleExit}
        onReplay={replay}
        level={level}
        total={state.round.questions.length}
        current={state.questionIndex}
        beside={
          voiceStatus === 'missing' && silentPrompt && <span className={styles.silentPrompt}>{silentPrompt(question)}</span>
        }
      />

      <div className={styles.body}>
        {showcase && (
          <button
            type="button"
            className={cx(styles.showcase, showcaseKind === 'word' && styles.wordShowcase, showcaseKind === 'scene' && styles.sceneShowcase)}
            aria-label={showcaseKind === 'scene' ? 'Frågan igen' : 'Lyssna på ordet'}
            onClick={sayAgain}
          >
            {showcase(question, { wrongTaps: state.removed.length, solved: state.phase === 'correct' })}
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
                onClick={() => choose(id)}
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
