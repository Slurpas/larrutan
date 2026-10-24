import { Fragment, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { cloud, meadowFlower, meadowSoil, meadowTop } from '../../art/bubbles'
import { cardBack } from '../../art/memory'
import { composeCharacter, outfitFeetRow } from '../../art/outfit'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { phrases } from '../../content/phrases'
import { getWord, words } from '../../content/words'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { speak, stopSpeech } from '../../speech/speech'
import { cx } from '../../ui/cx'
import { Picture } from '../../ui/Picture'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChallengeScreenProps } from '../challengeProps'
import { challengeDifficulties } from '../difficulty'
import { RoundComplete } from '../RoundComplete'
import { sceneScale } from '../sceneScale'
import { createMemoryRound, type MemoryCard } from './createRound'
import { closeCards, isFinished, startMemory, turnCard } from './memoryState'
import styles from './Memory.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }

/** Two cards that don't match stay face up this long (or until the next card is turned). */
const MISMATCH_MS = 1600
/** The last pair is enjoyed for a moment before the round ends. */
const FINISH_MS = 2200
/** Room for the top bar above the cards. */
const TOP_BAR = 160
/** The meadow's height, in art pixels. */
const GROUND = 32
/** The biggest a card gets, in screen pixels. */
const MAX_CARD = 200

/** The full rows that give the biggest cards in the room there is (3×2 or 2×3, 4×2 or 2×4). */
function cardGrid(count: number, width: number, height: number, gap: number) {
  let best = { cols: count, rows: 1, size: 0 }
  for (let cols = 2; cols <= count; cols++) {
    if (count % cols !== 0) continue
    const rows = count / cols
    const size = Math.min(MAX_CARD, (width - gap * (cols - 1)) / cols, (height - gap * (rows - 1)) / rows)
    if (size > best.size) best = { cols, rows, size }
  }
  return { ...best, size: Math.floor(best.size) }
}

/**
 * Memory: cards lie face down; each pair is a picture and the letter its word starts with.
 * The child turns two at a time and hears each one ("A.", "Anka."). A pair stays face up
 * with a chime and "anka börjar på A!"; two that don't match turn back after a moment,
 * or as soon as the next card is turned. Hard: four pairs instead of three, with two
 * letters that look alike. Nothing is timed.
 */
export function Memory({ seed, difficulty, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() =>
    createMemoryRound({ seed, words, letters, confusables: confusableLetters, difficulty, practiceBox }),
  )
  const [state, setState] = useState(() => startMemory(round))
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [done, setDone] = useState(false)
  const outfit = useProgress().worn
  const child = useMemo(() => composeCharacter('down', 0, outfit), [outfit])

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

  // What to do, once: the short form when the child knows the game; a hard round first says what is harder.
  useEffect(() => {
    const intro = knowsChallenge ? phrases.memoryShort : phrases.memoryIntro
    void speak(difficulty === 'hard' ? [phrases.moreCardsIntro, intro] : intro)
  }, [knowsChallenge, difficulty])
  useEffect(() => stopSpeech, [])

  // Two cards that don't match turn back after a moment.
  useEffect(() => {
    if (state.open.length !== 2) return
    const timer = setTimeout(() => setState(closeCards), MISMATCH_MS)
    return () => clearTimeout(timer)
  }, [state.open])

  // Every pair found: a moment to enjoy it, then the round is done.
  const finishRound = useEffectEvent(() => {
    const practiced = round.pairs.map((pair) => ({ item: pair, firstTry: !state.slipped.includes(pair) }))
    setOutcome(onRoundComplete({ wrongTaps: state.slips, practiced }))
    setDone(true)
  })
  const finished = isFinished(state)
  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(finishRound, FINISH_MS)
    return () => clearTimeout(timer)
  }, [finished])

  function turn(card: MemoryCard) {
    const { state: next, result } = turnCard(state, card.id)
    if (result === 'ignored') return
    setState(next)
    const word = getWord(card.pair)
    const letter = getLetter(card.letter).spoken
    if (result === 'match') void speak([{ sound: 'correct' }, phrases.firstLetterReveal(word.base, letter)])
    else void speak(card.kind === 'letter' ? phrases.letterShort(letter) : phrases.firstLetterShort(word.base))
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  /** Keys 1–8 turn the cards in reading order. */
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const card = round.cards[Number(event.key) - 1]
    if (card) turn(card)
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (done) return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />

  // Layout, in screen pixels.
  const px = sceneScale(size.width, size.height)
  const groundTop = size.height - GROUND * px
  const childLeft = Math.max(12 * px, size.width * 0.04)
  const childTop = groundTop - (outfitFeetRow - 1) * px
  const areaLeft = childLeft + (child[0]?.length ?? 0) * px + 4 * px
  const area = { left: areaLeft, top: TOP_BAR, width: size.width - areaLeft * 2, height: groundTop - 8 * px - TOP_BAR }
  const gap = Math.round(Math.max(16, px * 5))
  const grid = cardGrid(round.cards.length, area.width, area.height, gap)
  const gridWidth = grid.cols * grid.size + (grid.cols - 1) * gap
  const gridHeight = grid.rows * grid.size + (grid.rows - 1) * gap
  const pairsFound = state.matched.length / 2

  const sprite = (spriteGrid: readonly string[], left: number, top: number) => (
    <PixelSprite
      grid={spriteGrid}
      className={styles.sprite}
      style={{ left, top, width: (spriteGrid[0]?.length ?? 0) * px, height: spriteGrid.length * px }}
    />
  )

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--card': `${grid.size}px`, '--gap': `${gap}px` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling (e.g. a focused card scrolled into view).
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      {sprite(cloud, size.width * 0.06, TOP_BAR + 8 * px)}
      {sprite(cloud, size.width * 0.78, TOP_BAR - 4 * px)}
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
        {[0.32, 0.58, 0.86].map((x) => (
          <Fragment key={x}>{sprite(meadowFlower, size.width * x, -6 * px)}</Fragment>
        ))}
      </div>
      {sprite(child, childLeft, childTop)}

      <div
        className={styles.board}
        style={{
          left: area.left + (area.width - gridWidth) / 2,
          top: area.top + (area.height - gridHeight) / 2,
          gridTemplateColumns: `repeat(${grid.cols}, var(--card))`,
        }}
      >
        {round.cards.map((card, i) => {
          const isMatched = state.matched.includes(card.id)
          const faceUp = isMatched || state.open.includes(card.id)
          const word = getWord(card.pair)
          const face = card.kind === 'letter' ? getLetter(card.letter).display : word.base
          return (
            <button
              key={card.id}
              type="button"
              className={cx(styles.card, isMatched && styles.matched)}
              aria-label={faceUp ? `Kort ${i + 1}: ${face}` : `Kort ${i + 1}`}
              disabled={isMatched}
              onClick={() => turn(card)}
            >
              {/* Only the side that shows is drawn (no 3D, which not every browser can do); a new side squeezes in. */}
              <span
                key={faceUp ? 'face' : 'back'}
                className={cx(styles.side, faceUp ? styles.front : styles.back, faceUp && card.kind === 'picture' && styles.pictureFront)}
              >
                {!faceUp ? (
                  <PixelSprite grid={cardBack} className={styles.backArt} />
                ) : card.kind === 'letter' ? (
                  face
                ) : (
                  <Picture word={card.pair} />
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className={styles.top}>
        <ChallengeTopBar
          onExit={handleExit}
          onReplay={() => void speak(phrases.memoryIntro)}
          difficulty={difficulty}
          difficultyCount={challengeDifficulties.memory.length}
          total={round.pairs.length}
          current={pairsFound}
        />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}
