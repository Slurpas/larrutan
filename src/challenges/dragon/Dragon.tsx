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
import { meadowFlower, meadowSoil, meadowTop } from '../../art/bubbles'
import { cookie, cookieSize, crumbs, dragonFaces, dragonMouth, dragonSize } from '../../art/dragon'
import { composeCharacter, outfitFeetRow } from '../../art/outfit'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { stopSpeech } from '../../speech/speech'
import { useVoiceStatus } from '../../speech/useVoiceStatus'
import { cx } from '../../ui/cx'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import type { Difficulty } from '../difficulty'
import { RoundComplete } from '../RoundComplete'
import { sceneScale } from '../sceneScale'
import { useChoiceRound, type RoundResult } from '../useChoiceRound'
import type { ChallengeVoice } from '../voices'
import cards from '../ChoiceChallenge.module.css'
import styles from './Dragon.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }

/** A cookie's flight into the mouth (or back out), and how long the dragon chews or shakes its head. */
const FLY_MS = 450
const REFUSE_MS = 700
/** Chewing and the next question: the right answer's celebration. */
const EAT_MS = 1300
/** Room for the top bar above the cookies. */
const TOP_BAR = 160
/** The meadow's height, in art pixels. */
const GROUND = 32
/** A drag shorter than this is a tap. */
const DRAG_PX = 12

/**
 * idle: waiting for a cookie, for as long as the child needs
 * flying: a cookie on its way into the mouth
 * eating: the right cookie; the dragon chews, then the next question
 * refusing: the wrong cookie; the dragon shakes its head and the cookie comes back
 */
type Phase = 'idle' | 'flying' | 'eating' | 'refusing'

interface Feeding {
  question: number
  phase: Phase
  cookie: string | null
}

export interface DragonProps<Q extends ChoiceQuestion> {
  round: ChoiceRound<Q>
  voice: ChallengeVoice<Q>
  difficulty: Difficulty
  difficultyCount: number
  onRoundComplete?: (result: RoundResult) => RoundOutcome
  practiceItem: (question: Q) => string
  knowsChallenge?: boolean
  /** What a cookie shows: a letter. */
  renderChoice: (choice: string) => ReactNode
  /** Accessible name of a cookie (also used by tests). */
  choiceLabel: (choice: string) => string
  /** Shown next to the speaker when there is no Swedish voice. */
  silentPrompt?: (question: Q) => ReactNode
  onExit: () => void
  onPlayAgain: () => void
}

/**
 * Mata draken: a friendly dragon wants a letter cookie ("Draken vill ha ett A!"). The
 * child taps the right cookie, or drags it to the dragon, and it flies into the mouth.
 * Right: the dragon munches it. Wrong: it shakes its head, the cookie comes back grey
 * and the voice says what it was, the same help as everywhere. One decision per
 * question; nothing is timed. Asking, help and rewards are useChoiceRound's.
 */
export function Dragon<Q extends ChoiceQuestion>({
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
}: DragonProps<Q>) {
  const { state, question, revealed, outcome, choose, replay } = useChoiceRound({
    round,
    voice,
    difficulty,
    onRoundComplete,
    practiceItem,
    knowsChallenge,
    correctPauseMs: EAT_MS,
  })
  const voiceStatus = useVoiceStatus()
  const outfit = useProgress().worn
  const child = useMemo(() => composeCharacter('side', 0, outfit), [outfit])

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

  const [feeding, setFeeding] = useState<Feeding>({ question: state.questionIndex, phase: 'idle', cookie: null })
  // A new question: a new plate of cookies, the dragon waiting.
  if (feeding.question !== state.questionIndex) setFeeding({ question: state.questionIndex, phase: 'idle', cookie: null })
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  /** A cookie chosen while the dragon was still shaking its head: fed as soon as it is ready. */
  const pending = useRef<string | null>(null)
  const dragStart = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null)

  // Layout, in screen pixels.
  const px = sceneScale(size.width, size.height)
  const groundTop = size.height - GROUND * px
  const childLeft = Math.max(12 * px, size.width * 0.04)
  const childTop = groundTop - (outfitFeetRow - 1) * px
  const dragonLeft = size.width - (dragonSize.width + 6) * px
  const dragonTop = groundTop - (dragonSize.height - 3) * px
  const mouth = { x: dragonLeft + dragonMouth.x * px, y: dragonTop + dragonMouth.y * px }
  const cookiePx = cookieSize * px
  const choices = question?.choices ?? []
  const spacing = Math.min(cookiePx * 1.5, (size.width - 2 * 16 * px) / Math.max(1, choices.length))
  // The cookies hang in the air a little above the dragon's head, between the child and the dragon.
  const rowTop = TOP_BAR + Math.max(0, (dragonTop - TOP_BAR - cookiePx) * 0.75)
  const cookieAt = (i: number) => ({ x: size.width / 2 + (i - (choices.length - 1) / 2) * spacing, y: rowTop + cookiePx / 2 })

  // The cookie has reached the mouth: is it the right one?
  const arrived = useEffectEvent(() => {
    const id = feeding.cookie
    if (!question || !id) return
    choose(id)
    setFeeding((f) => ({ ...f, phase: id === question.target ? 'eating' : 'refusing' }))
  })
  useEffect(() => {
    if (feeding.phase !== 'flying') return
    const timer = setTimeout(() => arrived(), FLY_MS)
    return () => clearTimeout(timer)
  }, [feeding.phase])

  // Head shaken, cookie back on the plate (grey now): ready for the next try.
  const refused = useEffectEvent(() => {
    const next = pending.current
    pending.current = null
    const ok = next !== null && state.phase === 'asking' && !state.removed.includes(next)
    setFeeding((f) => ({ ...f, phase: ok ? 'flying' : 'idle', cookie: ok ? next : null }))
  })
  useEffect(() => {
    if (feeding.phase !== 'refusing') return
    const timer = setTimeout(() => refused(), REFUSE_MS)
    return () => clearTimeout(timer)
  }, [feeding.phase])

  function feed(id: string | undefined) {
    if (!id || !question || state.phase !== 'asking' || state.removed.includes(id)) return
    if (feeding.phase === 'refusing') pending.current = id
    if (feeding.phase !== 'idle') return
    setFeeding({ question: state.questionIndex, phase: 'flying', cookie: id })
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  // Dragging a cookie to the dragon also feeds it; a short drag counts as a tap.
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (feeding.phase !== 'idle' || state.removed.includes(id)) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { id, x: event.clientX, y: event.clientY, moved: false }
  }
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < DRAG_PX) return
    start.moved = true
    setDrag({ id: start.id, dx, dy })
  }
  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current
    dragStart.current = null
    if (!start?.moved) return
    setDrag(null)
    const rect = sceneRef.current?.getBoundingClientRect()
    const x = event.clientX - (rect?.left ?? 0)
    const y = event.clientY - (rect?.top ?? 0)
    const onDragon = x >= dragonLeft - 10 * px && y >= dragonTop - 10 * px
    if (onDragon) feed(start.id)
  }
  function handleClick(id: string) {
    // The click that ends a drag is not a tap.
    if (drag) return
    feed(id)
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question) return
    const number = Number(event.key)
    const byLabel = question.choices.find((id) => choiceLabel(id).toLocaleLowerCase('sv') === event.key.toLocaleLowerCase('sv'))
    if (Number.isInteger(number) && number >= 1 && number <= question.choices.length) feed(question.choices[number - 1])
    else if (byLabel) feed(byLabel)
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
  const face = feeding.phase === 'flying' ? 'open' : 'closed'

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--cookie': `${cookiePx}px`, '--fly': `${FLY_MS}ms` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling.
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
        {[0.3, 0.52].map((x) => (
          <Fragment key={x}>{sprite(meadowFlower, size.width * x, -6 * px)}</Fragment>
        ))}
      </div>
      {sprite(child, childLeft, childTop)}

      <div
        className={cx(styles.dragon, feeding.phase === 'refusing' && styles.shake)}
        style={{ left: dragonLeft, top: dragonTop, width: dragonSize.width * px, height: dragonSize.height * px }}
        aria-hidden="true"
      >
        {feeding.phase === 'eating' ? (
          <>
            <PixelSprite grid={dragonFaces.chew} className={cx(styles.fill, styles.chewA)} />
            <PixelSprite grid={dragonFaces.closed} className={cx(styles.fill, styles.chewB)} />
            {sprite(crumbs, (dragonMouth.x - 6) * px, (dragonMouth.y - 2) * px, styles.crumbs)}
          </>
        ) : (
          <PixelSprite grid={dragonFaces[face]} className={styles.fill} />
        )}
      </div>

      <div key={state.questionIndex} className={styles.plate}>
        {choices.map((id, i) => {
          const at = cookieAt(i)
          const isAnswer = id === question.target
          const isRemoved = state.removed.includes(id)
          const inMouth = feeding.cookie === id && (feeding.phase === 'flying' || feeding.phase === 'eating')
          const dragging = drag?.id === id
          const transform = inMouth
            ? `translate(${mouth.x - at.x}px, ${mouth.y - at.y}px) scale(0.3)`
            : dragging
              ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.08)`
              : undefined
          return (
            <button
              key={id}
              type="button"
              className={cx(
                styles.cookie,
                isRemoved && styles.removed,
                inMouth && styles.inMouth,
                dragging && styles.dragging,
                feeding.phase === 'eating' && inMouth && styles.eaten,
                state.phase === 'asking' && revealed && isAnswer && cards.reveal,
              )}
              style={{ left: at.x - cookiePx / 2, top: at.y - cookiePx / 2, transform, '--delay': `${i * 90}ms` } as CSSProperties}
              aria-label={choiceLabel(id)}
              disabled={isRemoved}
              onClick={() => handleClick(id)}
              onPointerDown={(event) => handlePointerDown(event, id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                dragStart.current = null
                setDrag(null)
              }}
            >
              <PixelSprite grid={cookie} className={styles.fill} />
              <span className={styles.letter}>{renderChoice(id)}</span>
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
