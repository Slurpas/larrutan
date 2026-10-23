import {
  Fragment,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cartSize, cartWithRider, floorTile, lantern, mineTile, planks, railTile, rockTile, tunnelMouth, tunnelSize } from '../../art/mine'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { stopSpeech } from '../../speech/speech'
import { useVoiceStatus } from '../../speech/useVoiceStatus'
import { cx } from '../../ui/cx'
import { CheckIcon } from '../../ui/icons'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import type { Difficulty } from '../difficulty'
import { RoundComplete } from '../RoundComplete'
import { useChoiceRound, type RoundResult } from '../useChoiceRound'
import type { ChallengeVoice } from '../voices'
import { arriving, departing, gateHeight, nearestLane, rideLayout, rideTimes, startLane, tunnelTop } from './ride'
import cards from '../ChoiceChallenge.module.css'
import styles from './MineCart.module.css'

const backgrounds = { floor: pixelBackground(floorTile), rail: pixelBackground(railTile), rock: pixelBackground(rockTile) }

/** Shorter rides on devices set to reduce motion. */
const motionFactor = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0.3 : 1
const times = {
  arrive: rideTimes.arrive * motionFactor,
  pass: rideTimes.pass * motionFactor,
  steer: rideTimes.steer * motionFactor,
  bump: rideTimes.bump * motionFactor,
}
/** How dark it gets inside a tunnel (user feedback 2026-10-23: 0.75 was too dark, 0.25 a bit too light). */
const tunnelDark = 0.4
/** A swipe must move this far (screen pixels); less is a tap. */
const swipeDistance = 40

/**
 * arriving: rolling towards the next wall (a choice made now is kept for the stop)
 * waiting: stopped in front of the tunnels, for as long as the child needs
 * steering: switching to the chosen track, then into its tunnel
 * bumping: the tunnel was wrong and is closed with planks; the cart rolls back
 * passing: through the right tunnel, on to the next question
 */
type RidePhase = 'arriving' | 'waiting' | 'steering' | 'bumping' | 'passing'

interface Ride {
  /** The question this ride belongs to; a new question starts a new ride. */
  question: number
  phase: RidePhase
  lane: number
  choice: string | null
  /** How long the steering takes: a moment when the cart is already on the right track. */
  steerMs: number
}

/** Where the world is: how far the cart has ridden and where the wall is (art pixels), and the tunnel darkness. */
interface Motion {
  travelled: number
  gate: number
  dark: number
}

export interface MineCartProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  voice: ChallengeVoice<Q>
  difficulty: Difficulty
  difficultyCount: number
  onRoundComplete?: (result: RoundResult) => RoundOutcome
  practiceItem: (question: Q) => string
  knowsChallenge?: boolean
  choiceKind: 'letter' | 'picture'
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a choice (also used by tests). */
  choiceLabel: (choice: string) => string
  /** Next to the speaker, e.g. the picture in Första bokstaven; tapping it says the word again. */
  showcase?: (question: Q) => ReactNode
  /** Shown next to the speaker when there is no Swedish voice. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * Gruvvagnen: the child rides a mine cart and answers by steering it into one of the
 * tunnels, each with a choice above it. The cart stops in front of the tunnels and
 * waits (no timers, PRD §11). A wrong tunnel is closed with planks and the cart bumps
 * back gently; the right one takes it on to the next question. Steer by tapping a
 * card or a track, swiping left/right (and up to go), or with the arrow keys; the
 * number keys pick a tunnel directly. Asking, help and rewards are useChoiceRound's.
 */
export function MineCart<Q extends ChoiceQuestion>({
  round,
  voice,
  difficulty,
  difficultyCount,
  onRoundComplete,
  practiceItem,
  knowsChallenge = false,
  choiceKind,
  renderChoice,
  choiceLabel,
  showcase,
  silentPrompt,
  onExit,
  onPlayAgain,
}: MineCartProps<Q>) {
  const { state, question, revealed, outcome, choose, replay, sayAgain } = useChoiceRound({
    round,
    voice,
    difficulty,
    onRoundComplete,
    practiceItem,
    knowsChallenge,
    correctPauseMs: times.pass,
  })
  const voiceStatus = useVoiceStatus()
  const outfit = useProgress().worn
  const cart = useMemo(() => cartWithRider(outfit), [outfit])

  const sceneRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const laneCount = question?.choices.length ?? 3
  const layout = rideLayout(size.width, size.height, laneCount)
  const { scale: px, lanes } = layout
  const layoutRef = useRef(layout)
  const motion = useRef<Motion>({ travelled: 0, gate: layout.gateStart, dark: 0 })
  /** A choice made while the cart can't take it yet (rolling in, bumping back): taken as soon as it can. */
  const pending = useRef<string | null>(null)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)

  const [ride, setRide] = useState<Ride>(() => newRide(state.questionIndex, laneCount))
  // A new question: a new ride, starting on the middle track.
  if (ride.question !== state.questionIndex) setRide(newRide(state.questionIndex, laneCount))

  useLayoutEffect(() => {
    layoutRef.current = layout
  })

  useLayoutEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(scene)
    return () => observer.disconnect()
  }, [])

  // Rolling in towards the next wall, braking to a stop in front of it.
  const arrived = useEffectEvent(() => {
    const choice = pending.current
    pending.current = null
    if (choice) steerTo(choice)
    else setRide((r) => ({ ...r, phase: 'waiting' }))
  })
  useEffect(() => {
    const { gateStart, gateStop } = layoutRef.current
    const { travelled, dark } = motion.current
    return tween(
      times.arrive,
      (t) => {
        const gate = gateStart + (gateStop - gateStart) * arriving(t)
        motion.current = { travelled: travelled + gate - gateStart, gate, dark: dark * Math.max(0, 1 - t / 0.3) }
        paintStage(stageRef.current, layoutRef.current.scale, motion.current)
      },
      () => arrived(),
    )
  }, [state.questionIndex])

  // Through the right tunnel: the wall slides past and it gets dark for a moment.
  useEffect(() => {
    if (state.phase !== 'correct') return
    const { gateGone } = layoutRef.current
    const { travelled, gate: from } = motion.current
    return tween(
      times.pass,
      (t) => {
        const gate = from + (gateGone - from) * departing(t)
        motion.current = { travelled: travelled + gate - from, gate, dark: tunnelDark * Math.max(0, (t - 0.45) / 0.55) }
        paintStage(stageRef.current, layoutRef.current.scale, motion.current)
      },
      () => {},
    )
  }, [state.phase])

  // While stopped, the wall stays in front of the cart, also when the screen turns.
  useEffect(() => {
    if (ride.phase === 'arriving' || ride.phase === 'passing') return
    motion.current = { ...motion.current, gate: layout.gateStop }
    paintStage(stageRef.current, layout.scale, motion.current)
  }, [ride.phase, layout.gateStop, layout.scale])

  // Steered onto the chosen track: into its tunnel.
  const steered = useEffectEvent(() => {
    const choice = ride.choice
    if (!question || !choice || state.phase !== 'asking' || state.removed.includes(choice)) {
      setRide((r) => ({ ...r, phase: 'waiting', choice: null }))
      return
    }
    choose(choice)
    setRide((r) => ({ ...r, phase: choice === question.target ? 'passing' : 'bumping' }))
  })
  useEffect(() => {
    if (ride.phase !== 'steering') return
    const id = setTimeout(() => steered(), ride.steerMs)
    return () => clearTimeout(id)
  }, [ride.phase, ride.steerMs])

  // Bumped back from a closed tunnel: ready again (or straight on, if the child already chose).
  const bumped = useEffectEvent(() => {
    const choice = pending.current
    pending.current = null
    if (choice) steerTo(choice)
    else setRide((r) => ({ ...r, phase: 'waiting', choice: null }))
  })
  useEffect(() => {
    if (ride.phase !== 'bumping') return
    const id = setTimeout(() => bumped(), times.bump)
    return () => clearTimeout(id)
  }, [ride.phase])

  function steerTo(choice: string) {
    const lane = question?.choices.indexOf(choice) ?? -1
    if (lane < 0) return
    setRide((r) => ({ ...r, phase: 'steering', lane, choice, steerMs: lane === r.lane ? 80 : times.steer }))
  }

  /** The child picks a tunnel (tap, key, swipe up). Taken now if the cart is waiting, else as soon as it can. */
  function commit(choice: string | undefined) {
    if (!choice || !question || state.phase !== 'asking' || state.removed.includes(choice)) return
    const lane = question.choices.indexOf(choice)
    if (lane < 0) return
    if (ride.phase === 'waiting') {
      steerTo(choice)
    } else if (ride.phase === 'arriving' || ride.phase === 'bumping') {
      pending.current = choice
      if (ride.phase === 'arriving') setRide((r) => ({ ...r, lane }))
    }
  }

  /** Moves the cart one track over without choosing yet (arrow keys, swipes). */
  function steer(step: 1 | -1) {
    if (ride.phase !== 'arriving' && ride.phase !== 'waiting') return
    setRide((r) => ({ ...r, lane: Math.max(0, Math.min(laneCount - 1, r.lane + step)) }))
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question) return
    const number = Number(event.key)
    if (Number.isInteger(number) && number >= 1 && number <= question.choices.length) {
      commit(question.choices[number - 1])
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      steer(event.key === 'ArrowRight' ? 1 : -1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      commit(question.choices[ride.lane])
    }
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  function handlePointerDown(event: PointerEvent) {
    const target = event.target as HTMLElement
    const onControl = target.closest('button') || topRef.current?.contains(target)
    swipeStart.current = onControl ? null : { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: PointerEvent) {
    const start = swipeStart.current
    swipeStart.current = null
    if (!start || !question) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) > swipeDistance && Math.abs(dx) > Math.abs(dy)) steer(dx > 0 ? 1 : -1)
    else if (dy < -swipeDistance) commit(question.choices[ride.lane])
    else if (Math.hypot(dx, dy) < swipeDistance / 2) {
      // A tap on the ground: the track nearest to it.
      const left = sceneRef.current?.getBoundingClientRect().left ?? 0
      commit(question.choices[nearestLane((event.clientX - left) / px, lanes)])
    }
  }

  if (state.phase === 'finished' || !question) {
    return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  const place = (x: number, y: number, grid: readonly string[]): CSSProperties => ({
    left: x * px,
    top: y * px,
    width: (grid[0]?.length ?? 0) * px,
    height: grid.length * px,
  })
  const rolling = ride.phase === 'arriving' || ride.phase === 'passing'

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px` } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => (swipeStart.current = null)}
      // Older Safari has no overflow: clip, so undo any scrolling (e.g. a focused card scrolled into view).
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.floor} style={{ backgroundImage: backgrounds.floor }} />
        {lanes.map((x, i) => (
          <div key={i} className={styles.rails} style={{ left: (x - mineTile / 2) * px, backgroundImage: backgrounds.rail }} />
        ))}
        <div className={cx(styles.wall, styles.wallLeft)} style={{ backgroundImage: backgrounds.rock }} />
        <div className={cx(styles.wall, styles.wallRight)} style={{ backgroundImage: backgrounds.rock }} />

        <div
          className={styles.cart}
          style={{ ...place(lanes[ride.lane]! - cartSize.width / 2, layout.cartTop, cart), transitionDuration: `${times.steer}ms` }}
        >
          <PixelSprite grid={cart} className={cx(styles.fill, rolling && styles.rolling, ride.phase === 'bumping' && styles.bump)} />
        </div>

        <div className={styles.gate} style={{ height: gateHeight * px, backgroundImage: backgrounds.rock }}>
          {lanes.slice(1).map((x, i) => (
            <div key={i} className={styles.at} style={place((x + lanes[i]!) / 2 - lantern[0]!.length / 2, 10, lantern)}>
              <PixelSprite grid={lantern} className={styles.fill} />
            </div>
          ))}
          {question.choices.map((id, i) => {
            const x = lanes[i]!
            const isAnswer = id === question.target
            const isCorrect = state.phase === 'correct' && isAnswer
            const isRemoved = state.removed.includes(id)
            return (
              <Fragment key={`${state.questionIndex}-${id}`}>
                <div className={styles.at} style={place(x - tunnelSize.width / 2, tunnelTop, tunnelMouth)}>
                  <PixelSprite grid={tunnelMouth} className={styles.fill} />
                </div>
                {isRemoved && (
                  <div className={cx(styles.at, styles.planks)} style={place(x - planks[0]!.length / 2, tunnelTop + 12, planks)}>
                    <PixelSprite grid={planks} className={styles.fill} />
                  </div>
                )}
                <button
                  type="button"
                  className={cx(
                    cards.card,
                    choiceKind === 'picture' && cards.pictureCard,
                    styles.choice,
                    isRemoved && cards.removed,
                    isCorrect && cards.correct,
                    state.phase === 'correct' && !isAnswer && cards.faded,
                    state.phase === 'asking' && revealed && isAnswer && cards.reveal,
                  )}
                  style={{ left: x * px }}
                  aria-label={choiceLabel(id)}
                  disabled={isRemoved}
                  onClick={() => commit(id)}
                >
                  {renderChoice(id)}
                  {isCorrect && (
                    <span className={cards.badge}>
                      <CheckIcon />
                    </span>
                  )}
                </button>
              </Fragment>
            )
          })}
        </div>

        <div className={styles.dark} />
      </div>

      <div ref={topRef} className={styles.top}>
        <ChallengeTopBar
          onExit={handleExit}
          onReplay={replay}
          difficulty={difficulty}
          difficultyCount={difficultyCount}
          total={state.round.questions.length}
          current={state.questionIndex}
          beside={
            <>
              {showcase && (
                <button type="button" className={styles.showcase} aria-label="Lyssna på ordet" onClick={sayAgain}>
                  {showcase(question)}
                </button>
              )}
              {voiceStatus === 'missing' && silentPrompt && <span className={cards.silentPrompt}>{silentPrompt(question)}</span>}
            </>
          }
        />
      </div>
      <p className={styles.seed}>#{state.round.seed}</p>
    </main>
  )
}

function newRide(question: number, laneCount: number): Ride {
  return { question, phase: 'arriving', lane: startLane(laneCount), choice: null, steerMs: 0 }
}

/** Moves the world: the floor, tracks and side walls scroll; the wall with the tunnels sits where `gate` says. */
function paintStage(stage: HTMLElement | null, scale: number, { travelled, gate, dark }: Motion) {
  if (!stage) return
  const tile = mineTile * scale
  stage.style.setProperty('--shift', `${(travelled * scale) % tile}px`)
  stage.style.setProperty('--gate', `${gate * scale}px`)
  stage.style.setProperty('--dark', dark.toFixed(3))
}

/** Runs `frame` with time going 0 → 1 over `duration`, then `done`. Returns a cancel function. */
function tween(duration: number, frame: (t: number) => void, done: () => void): () => void {
  let id = 0
  const start = performance.now()
  const step = (now: number) => {
    const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1
    frame(t)
    if (t < 1) id = requestAnimationFrame(step)
    else done()
  }
  id = requestAnimationFrame(step)
  return () => cancelAnimationFrame(id)
}
