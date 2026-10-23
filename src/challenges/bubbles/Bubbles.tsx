import { Fragment, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import {
  bubbleBlower,
  bubbleBurst,
  bubbleFill,
  bubbleRing,
  bubbleSize,
  cloud,
  meadowFlower,
  meadowSoil,
  meadowTop,
  wandRing,
} from '../../art/bubbles'
import { outfitFeetRow } from '../../art/outfit'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { playEffect, stopSpeech } from '../../speech/speech'
import { useVoiceStatus } from '../../speech/useVoiceStatus'
import { cx } from '../../ui/cx'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import type { Difficulty } from '../difficulty'
import { RoundComplete } from '../RoundComplete'
import { useChoiceRound, type RoundResult } from '../useChoiceRound'
import type { ChallengeVoice } from '../voices'
import { bubbleLayout, bubbleScale, bubblesFor, type Bubble } from './bubbleRules'
import cards from '../ChoiceChallenge.module.css'
import styles from './Bubbles.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }

/** While the bubbles left over from a question float away, before the next one is blown. */
const LEAVE_MS = 1300
/** Room for the top bar (home, speaker, progress) above the bubbles. */
const TOP_BAR = 160
/** The meadow's height, in art pixels: a grassy tile and soil. */
const GROUND = 32

export interface BubblesProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  voice: ChallengeVoice<Q>
  difficulty: Difficulty
  difficultyCount: number
  onRoundComplete?: (result: RoundResult) => RoundOutcome
  practiceItem: (question: Q) => string
  knowsChallenge?: boolean
  /** What a bubble shows: a letter. */
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a bubble (also used by tests). */
  choiceLabel: (choice: string) => string
  /** Shown next to the speaker when there is no Swedish voice. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * Bubblor: the child's character blows soap bubbles with letters in them, and the child
 * pops every bubble with the letter asked for ("Hitta alla A!"). Several right bubbles
 * per question means more practice. A wrong letter doesn't pop: all its bubbles turn
 * grey and the voice names it, the same help as everywhere. Nothing is timed; the
 * bubbles bob in place until the child is done. Asking, help and rewards are
 * useChoiceRound's; the round only counts as answered when the last right bubble pops.
 */
export function Bubbles<Q extends ChoiceQuestion>({
  round,
  voice,
  difficulty,
  difficultyCount,
  onRoundComplete,
  practiceItem,
  knowsChallenge = false,
  renderChoice,
  choiceLabel,
  silentPrompt,
  onExit,
  onPlayAgain,
}: BubblesProps<Q>) {
  const { state, question, revealed, outcome, choose, replay } = useChoiceRound({
    round,
    voice,
    difficulty,
    onRoundComplete,
    practiceItem,
    knowsChallenge,
    correctPauseMs: LEAVE_MS,
  })
  const voiceStatus = useVoiceStatus()
  const outfit = useProgress().worn
  const blower = useMemo(() => bubbleBlower(outfit), [outfit])

  const sceneRef = useRef<HTMLElement>(null)
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useLayoutEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  // The bubbles popped so far in this question; a new question starts with none.
  const [popped, setPopped] = useState<{ question: number; ids: readonly string[] }>({ question: 0, ids: [] })
  const poppedIds = popped.question === state.questionIndex ? popped.ids : []

  const bubbles = useMemo(
    () => (question ? bubblesFor(question, round.seed, state.questionIndex) : []),
    [question, round.seed, state.questionIndex],
  )

  // Layout, in screen pixels.
  const px = bubbleScale(size.width, size.height)
  const bubblePx = bubbleSize * px
  const groundTop = size.height - GROUND * px
  const blowerLeft = Math.max(12 * px, size.width * 0.04)
  const blowerTop = groundTop - (outfitFeetRow - 2) * px
  const wand = { x: blowerLeft + wandRing.x * px, y: blowerTop + wandRing.y * px }
  const areaLeft = blowerLeft + (blower[0]?.length ?? 0) * px + 4 * px
  const area = { left: areaLeft, top: TOP_BAR, width: size.width - areaLeft - 8 * px, height: groundTop - 8 * px - TOP_BAR }
  const homes = bubbleLayout(bubbles.length, area, bubblePx, round.seed + state.questionIndex)

  function pop(bubble: Bubble) {
    if (!question || state.phase !== 'asking' || state.removed.includes(bubble.letter) || poppedIds.includes(bubble.id)) return
    if (bubble.letter !== question.target) {
      // Wrong: it doesn't pop; its letter turns grey and the voice says what it was.
      choose(bubble.letter)
      return
    }
    const ids = [...poppedIds, bubble.id]
    setPopped({ question: state.questionIndex, ids })
    playEffect('pop')
    if (bubbles.every((b) => b.letter !== question.target || ids.includes(b.id))) choose(question.target)
  }

  /** A key: the letter itself (or 1, 2, 3 for the letters in order) pops the next bubble with that letter. */
  function popByLetter(letter: string | undefined) {
    const bubble = bubbles.find((b) => b.letter === letter && !poppedIds.includes(b.id))
    if (bubble) pop(bubble)
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question) return
    const number = Number(event.key)
    const byLabel = question.choices.find((id) => choiceLabel(id).toLocaleLowerCase('sv') === event.key.toLocaleLowerCase('sv'))
    if (Number.isInteger(number) && number >= 1 && number <= question.choices.length) popByLetter(question.choices[number - 1])
    else if (byLabel) popByLetter(byLabel)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      moveFocus(sceneRef.current, event.key === 'ArrowRight' ? 1 : -1)
    }
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (state.phase === 'finished' || !question) {
    return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  const sprite = (grid: readonly string[], left: number, top: number, className?: string) => (
    <PixelSprite
      grid={grid}
      className={cx(styles.sprite, className)}
      style={{ left, top, width: (grid[0]?.length ?? 0) * px, height: grid.length * px }}
    />
  )

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--bubble': `${bubblePx}px` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling (e.g. a focused bubble scrolled into view).
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      {sprite(cloud, size.width * 0.18, TOP_BAR + 10 * px)}
      {sprite(cloud, size.width * 0.62, TOP_BAR - 6 * px)}
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
        {[0.32, 0.58, 0.86].map((x) => (
          <Fragment key={x}>{sprite(meadowFlower, size.width * x, -6 * px)}</Fragment>
        ))}
      </div>
      {sprite(blower, blowerLeft, blowerTop)}

      <div key={state.questionIndex} className={styles.bubbles}>
        {bubbles.map((bubble, i) => {
          const home = homes[i]
          if (!home) return null
          const isTarget = bubble.letter === question.target
          const isPopped = poppedIds.includes(bubble.id)
          const isRemoved = state.removed.includes(bubble.letter)
          const leaving = state.phase === 'correct'
          return (
            <button
              key={bubble.id}
              type="button"
              className={cx(styles.bubble, isRemoved && styles.removed, isPopped && styles.popped, leaving && !isPopped && styles.leaving)}
              style={
                {
                  left: home.x - bubblePx / 2,
                  top: home.y - bubblePx / 2,
                  '--from-x': `${wand.x - home.x}px`,
                  '--from-y': `${wand.y - home.y}px`,
                  '--delay': `${i * 140}ms`,
                  '--bob': `${2400 + (i % 3) * 450}ms`,
                } as CSSProperties
              }
              aria-label={choiceLabel(bubble.letter)}
              aria-hidden={isPopped || undefined}
              disabled={isRemoved || isPopped}
              onClick={() => pop(bubble)}
            >
              <span className={cx(styles.float, revealed && isTarget && !isPopped && styles.reveal)}>
                <PixelSprite grid={bubbleFill} className={styles.fill} />
                <PixelSprite grid={bubbleRing} className={styles.ring} />
                <span className={styles.letter}>{renderChoice(bubble.letter)}</span>
              </span>
              {isPopped && <PixelSprite grid={bubbleBurst} className={styles.burst} />}
            </button>
          )
        })}
      </div>

      <div className={styles.top}>
        <ChallengeTopBar
          onExit={handleExit}
          onReplay={replay}
          difficulty={difficulty}
          difficultyCount={difficultyCount}
          total={state.round.questions.length}
          current={state.questionIndex}
          beside={voiceStatus === 'missing' && silentPrompt && <span className={cards.silentPrompt}>{silentPrompt(question)}</span>}
        />
      </div>
      <p className={styles.seed}>#{state.round.seed}</p>
    </main>
  )
}

function moveFocus(container: HTMLElement | null, step: 1 | -1) {
  if (!container) return
  const buttons = [...container.querySelectorAll<HTMLButtonElement>(`.${styles.bubble}:not(:disabled)`)]
  if (buttons.length === 0) return
  const index = buttons.findIndex((button) => button === document.activeElement)
  const next = index === -1 ? (step === 1 ? 0 : buttons.length - 1) : (index + step + buttons.length) % buttons.length
  buttons[next]?.focus()
}
