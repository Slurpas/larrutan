import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { meadowSoil, meadowTop } from '../../art/bubbles'
import { bloom, cellSize, hintFlowers, mowedGrass, mowerRiderSize, mowerWithRider, tallGrass } from '../../art/garden'
import { numberWord } from '../../content/numbers'
import { phrases } from '../../content/phrases'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { speak, stopSpeech, type Utterance } from '../../speech/speech'
import { cx } from '../../ui/cx'
import { CheckIcon } from '../../ui/icons'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChallengeScreenProps } from '../challengeProps'
import { levelIntro, levelParams } from '../levels'
import { RoundComplete } from '../RoundComplete'
import { sceneScale } from '../sceneScale'
import { WRONG_PAUSE_MS } from '../useChoiceRound'
import { createMowerRound, sumKey, type Cell, type MowerQuestion } from './createRound'
import { answerSum, cellKey, currentSum, driveToward, isFinished, isRevealed, mowerScore, startMowing } from './mowerState'
import cardStyles from '../ChoiceChallenge.module.css'
import styles from './Mower.module.css'

const backgrounds = {
  meadowTop: pixelBackground(meadowTop),
  meadowSoil: pixelBackground(meadowSoil),
  tall: pixelBackground(tallGrass),
  light: pixelBackground(mowedGrass(false)),
  dark: pixelBackground(mowedGrass(true)),
  hint: pixelBackground(hintFlowers),
}
/** Room for the top bar above the lawn, and for the sum and its numbers under it. */
const TOP_BAR = 150
const PANEL = 250
/** The meadow's height, in art pixels. */
const GROUND = 16
const MAX_CELL = 130
/** How long the mower takes from one cell to the next. */
const STEP_MS = 280
/** The right number stays green this long before the mower may drive on. */
const CORRECT_MS = 1100
/** The last flower is enjoyed for a moment before the round ends. */
const FINISH_MS = 1600

/**
 * Gräsklipparen, in the town of maths (the user's idea, 2026-10-27): the child rides a mower
 * over a lawn, by tapping or dragging where to go (or the arrow keys). Flowers peek through the
 * tall grass where a sum hides; mowing over one stops the mower, the sum is read out ("Vad
 * blir det? Två. Plus. Ett.") and the child taps the answer among close numbers. A wrong number
 * is named and greyed out; when only the answer is left it is pointed at. An answered sum
 * becomes a flower in bloom. Done when every sum is answered. Nothing is timed.
 */
export function Mower({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const params = levelParams('mower', level)
  const [round] = useState(() =>
    createMowerRound({ seed, maxResult: params.maxResult, minus: params.minus, sums: params.sums, choices: params.choices, practiceBox }),
  )
  const [state, setState] = useState(() => startMowing(round))
  const [goal, setGoal] = useState<Cell | null>(null)
  /** A right answer, shown green for a moment before the panel goes. */
  const [celebrating, setCelebrating] = useState<MowerQuestion | null>(null)
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [done, setDone] = useState(false)
  const outfit = useProgress().worn
  const riders = useMemo(() => ({ right: mowerWithRider(outfit, 'right'), left: mowerWithRider(outfit, 'left') }), [outfit])
  const dragging = useRef(false)

  const sceneRef = useRef<HTMLElement>(null)
  const lawnRef = useRef<HTMLDivElement>(null)
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

  const sum = currentSum(state)
  const shownSum = sum ?? celebrating
  /** The sum read out: "Två. Plus. Ett." */
  const sumWords = (q: MowerQuestion): Utterance[] => [
    phrases.numberShort(numberWord(q.parts[0])),
    q.sign === '+' ? phrases.plus : phrases.minus,
    phrases.numberShort(numberWord(q.parts[1])),
  ]

  // What to do, once: the short form when the child knows the game, after what is new at a new level.
  const newLevel = announceLevel ? levelIntro('mower', level) : undefined
  useEffect(() => {
    const intro = knowsChallenge ? phrases.mowerShort : phrases.mowerIntro
    void speak(newLevel ? [newLevel, intro] : intro)
  }, [knowsChallenge, newLevel])
  useEffect(() => stopSpeech, [])

  // Drive one cell at a time towards where the child tapped, until there or a sum stops the mower.
  useEffect(() => {
    if (!goal || state.asking || celebrating || isFinished(state)) return
    if (state.mower.col === goal.col && state.mower.row === goal.row) return
    const timer = setTimeout(() => {
      const next = driveToward(state, goal)
      setState(next)
      // A sum found on the way: the mower stops there.
      if (next.asking) {
        setGoal(null)
        dragging.current = false
      }
    }, STEP_MS)
    return () => clearTimeout(timer)
  }, [state, goal, celebrating])

  // A sum found: read it out.
  const foundCount = state.found.length
  const askFound = useEffectEvent(() => {
    if (sum) void speak([phrases.mowerQuestion, ...sumWords(sum)])
  })
  useEffect(() => {
    if (foundCount > 0) askFound()
  }, [foundCount])

  // Every sum answered: a moment to enjoy the flowers, then the round is done.
  const finishRound = useEffectEvent(() => {
    const practiced = round.questions.map((q, i) => ({ item: sumKey(q), firstTry: state.firstTry[i] ?? false }))
    setOutcome(onRoundComplete({ score: mowerScore(state), practiced }))
    setDone(true)
  })
  const finished = isFinished(state)
  useEffect(() => {
    if (!finished || celebrating) return
    const timer = setTimeout(finishRound, FINISH_MS)
    return () => clearTimeout(timer)
  }, [finished, celebrating])

  useEffect(() => {
    if (!celebrating) return
    const timer = setTimeout(() => setCelebrating(null), CORRECT_MS)
    return () => clearTimeout(timer)
  }, [celebrating])

  function choose(choice: string) {
    if (!sum || celebrating) return
    const { state: next, result } = answerSum(state, choice)
    if (result === 'ignored') return
    setState(next)
    if (result === 'right') {
      setCelebrating(sum)
      void speak({ sound: 'correct' })
    } else {
      void speak([phrases.numberShort(numberWord(Number(choice))), { pause: WRONG_PAUSE_MS }, ...(isRevealed(next) ? [phrases.hereIs(numberWord(Number(sum.target)))] : sumWords(sum))])
    }
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  // Keys: the arrows drive one cell; a digit answers (0 is 10).
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const steps: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
    const step = steps[event.key]
    if (step && !state.asking) {
      event.preventDefault()
      const next = { col: state.mower.col + step[0], row: state.mower.row + step[1] }
      if (next.col >= 0 && next.row >= 0 && next.col < round.cols && next.row < round.rows) setGoal(next)
    } else if (/^[0-9]$/.test(event.key)) choose(event.key === '0' ? '10' : event.key)
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (done) return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />

  // Layout, in screen pixels: the lawn in the middle, room for the sum under it, the meadow at the bottom.
  const px = sceneScale(size.width, size.height)
  const groundTop = size.height - GROUND * px
  const cell = Math.floor(Math.min(MAX_CELL, (size.width - 48) / round.cols, (size.height - TOP_BAR - PANEL - 24) / round.rows))
  const lawnWidth = cell * round.cols
  const lawnHeight = cell * round.rows
  const lawnLeft = Math.round((size.width - lawnWidth) / 2)
  const lawnTop = TOP_BAR + Math.max(0, Math.round((size.height - TOP_BAR - PANEL - lawnHeight) / 2))
  const art = cell / cellSize
  const rider = riders[state.facing]

  function cellAt(event: PointerEvent<HTMLDivElement>): Cell | null {
    const rect = lawnRef.current?.getBoundingClientRect()
    if (!rect) return null
    const col = Math.floor((event.clientX - rect.left) / cell)
    const row = Math.floor((event.clientY - rect.top) / cell)
    return col >= 0 && row >= 0 && col < round.cols && row < round.rows ? { col, row } : null
  }
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (state.asking || celebrating || finished) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragging.current = true
    const target = cellAt(event)
    if (target) setGoal(target)
  }
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging.current || state.asking) return
    const target = cellAt(event)
    if (target && (target.col !== goal?.col || target.row !== goal?.row)) setGoal(target)
  }

  const answered = (spot: number) => state.found.indexOf(spot) >= 0 && state.found.indexOf(spot) < state.firstTry.length

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px` } as CSSProperties}
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
      </div>

      <div
        ref={lawnRef}
        className={styles.lawn}
        style={{ left: lawnLeft, top: lawnTop, width: lawnWidth, height: lawnHeight }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {Array.from({ length: round.rows }, (_, row) =>
          Array.from({ length: round.cols }, (_, col) => {
            const key = cellKey({ col, row })
            const mowed = state.mowed.includes(key)
            const spot = round.spots.findIndex((s) => s.col === col && s.row === row)
            const hidden = spot >= 0 && !state.found.includes(spot)
            return (
              <div
                key={key}
                data-cell={key}
                className={styles.cell}
                style={{
                  left: col * cell,
                  top: row * cell,
                  width: cell,
                  height: cell,
                  backgroundImage: [hidden && backgrounds.hint, mowed ? (col % 2 === 0 ? backgrounds.light : backgrounds.dark) : backgrounds.tall].filter(Boolean).join(', '),
                }}
              >
                {spot >= 0 && answered(spot) && <PixelSprite grid={bloom} className={styles.bloom} />}
              </div>
            )
          }),
        )}
        <PixelSprite
          grid={rider}
          className={styles.mower}
          style={{
            width: mowerRiderSize.width * art,
            height: mowerRiderSize.height * art,
            left: state.mower.col * cell + cell / 2 - (mowerRiderSize.width * art) / 2,
            top: state.mower.row * cell + cell * 0.95 - mowerRiderSize.height * art,
            transitionDuration: `${STEP_MS}ms`,
          }}
        />
      </div>

      {shownSum && (
        <div className={styles.panel} style={{ top: lawnTop + lawnHeight + 12 }}>
          <span className={styles.sum} aria-label={`${shownSum.parts[0]} ${shownSum.sign === '+' ? 'plus' : 'minus'} ${shownSum.parts[1]}`} role="img">
            <Part value={shownSum.parts[0]} dots={params.dots} />
            <span className={styles.sign}>{shownSum.sign === '+' ? '+' : '−'}</span>
            <Part value={shownSum.parts[1]} dots={params.dots} />
            <span className={styles.sign}>=</span>
            <span className={cx(styles.answer, celebrating && styles.solved)}>{celebrating ? shownSum.target : '?'}</span>
          </span>
          <div className={styles.choices}>
            {shownSum.choices.map((choice) => {
              const removed = state.asking?.removed.includes(choice) ?? false
              const right = celebrating !== null && choice === shownSum.target
              return (
                <button
                  key={`${state.found.length}-${choice}`}
                  type="button"
                  className={cx(
                    cardStyles.card,
                    removed && cardStyles.removed,
                    right && cardStyles.correct,
                    celebrating && !right && cardStyles.faded,
                    sum && isRevealed(state) && choice === sum.target && cardStyles.reveal,
                  )}
                  aria-label={choice}
                  disabled={removed || celebrating !== null}
                  onClick={() => choose(choice)}
                >
                  {choice}
                  {right && (
                    <span className={cardStyles.badge}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={styles.top}>
        <ChallengeTopBar
          onExit={handleExit}
          onReplay={() => void speak(sum ? [phrases.mowerQuestion, ...sumWords(sum)] : phrases.mowerIntro)}
          level={level}
          total={round.spots.length}
          current={state.firstTry.length}
        />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}

/** A number in the sum, with as many dots under it on the easier levels. */
function Part({ value, dots }: { value: number; dots: boolean }) {
  return (
    <span className={styles.part}>
      {value}
      {dots && (
        <span className={styles.dots}>
          {Array.from({ length: value }, (_, i) => (
            <span key={i} className={styles.dot} />
          ))}
        </span>
      )}
    </span>
  )
}
