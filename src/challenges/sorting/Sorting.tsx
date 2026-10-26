import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { meadowSoil, meadowTop } from '../../art/bubbles'
import { cardBack } from '../../art/memory'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { phrases } from '../../content/phrases'
import { getWord, words } from '../../content/words'
import type { RoundOutcome } from '../../rewards/progress'
import { playEffect, speak, stopSpeech } from '../../speech/speech'
import { cx } from '../../ui/cx'
import { Picture } from '../../ui/Picture'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChallengeScreenProps } from '../challengeProps'
import { lookAlikeRule } from '../difficulty'
import { levelIntro, levelParams } from '../levels'
import { RoundComplete } from '../RoundComplete'
import { sceneScale } from '../sceneScale'
import { createSortingRound } from './createRound'
import { isFinished, isSetDone, moveCard, pileLetter, setOf, sortingScore, startSorting } from './sortingState'
import styles from './Sorting.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }
/** Room for the top bar above the piles' letters. */
const TOP_BAR = 150
/** The meadow's height, in art pixels. */
const GROUND = 20
/** The biggest a card gets, in screen pixels. */
const MAX_CARD = 160
/** How much of a face-up card shows under the next one, and of a face-down card, as parts of a card. */
const FACE_UP_STEP = 0.52
const FACE_DOWN_STEP = 0.16
/** The last pile sorted is enjoyed for a moment before the round ends. */
const FINISH_MS = 1800
/** A drag shorter than this is a tap. */
const DRAG_PX = 12

interface Drag {
  from: number
  dx: number
  dy: number
}

/**
 * Sortera korten: cards in piles, each a letter or a picture. Tap a pile to pick up its top
 * card (its name is said), then tap where it goes; or drag it there. A card may go on an
 * empty pile, or on a card of its own letter; anywhere else it comes back, and both cards
 * are named. From the second level only the top cards start face up. Once a pile has its
 * letter at the bottom and nothing else, or every card of a letter, the letter shows above
 * it. Done when every letter has its pile. Nothing is timed.
 */
export function Sorting({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const params = levelParams('sorting', level)
  const [round] = useState(() =>
    createSortingRound({
      seed,
      words,
      letters,
      confusables: confusableLetters,
      sets: params.sets,
      cardsPerSet: params.cardsPerSet,
      difficulty: lookAlikeRule(params.lookAlikes),
      practiceBox,
    }),
  )
  const [state, setState] = useState(() => startSorting(round, params.hidden))
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  /** Cards turned face up by the last move: they turn over. */
  const [turned, setTurned] = useState<readonly string[]>([])
  /** The card just refused, and a counter so the shake can repeat. */
  const [refused, setRefused] = useState<{ card: string; count: number } | null>(null)
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [done, setDone] = useState(false)
  const dragStart = useRef<{ from: number; x: number; y: number; moved: boolean } | null>(null)

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

  // What to do, once: the short form when the child knows the game. The first round at a new level starts by saying what is new.
  const newLevel = announceLevel ? levelIntro('sorting', level) : undefined
  useEffect(() => {
    const intro = knowsChallenge ? phrases.sortingShort : phrases.sortingIntro
    void speak(newLevel ? [newLevel, intro] : intro)
  }, [knowsChallenge, newLevel])
  useEffect(() => stopSpeech, [])

  // Every letter has its pile: a moment to enjoy it, then the round is done.
  const finishRound = useEffectEvent(() => {
    const practiced = Object.values(round.cards)
      .filter((card) => card.kind === 'picture')
      .map((card) => ({ item: card.word!, firstTry: !state.slipped.includes(card.id) }))
    setOutcome(onRoundComplete({ score: sortingScore(state), practiced }))
    setDone(true)
  })
  const finished = isFinished(state)
  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(finishRound, FINISH_MS)
    return () => clearTimeout(timer)
  }, [finished])

  /** What a card is called: "A." for a letter, "Anka." for a picture. */
  function nameOf(cardId: string): string {
    const card = round.cards[cardId]!
    return card.kind === 'letter' ? phrases.letterShort(getLetter(card.set).spoken) : phrases.firstLetterShort(getWord(card.word!).base)
  }

  function pickUp(pile: number) {
    const top = state.piles[pile]?.at(-1)
    if (!top) return
    setSelected(pile)
    void speak(nameOf(top))
  }

  function moveTo(from: number, to: number) {
    setSelected(null)
    const card = state.piles[from]?.at(-1)
    const { state: next, result } = moveCard(state, from, to)
    if (result === 'ignored' || !card) return
    setState(next)
    if (result === 'wrong') {
      // It comes back; both cards are named, so the child hears that they start differently.
      setRefused((r) => ({ card, count: (r?.count ?? 0) + 1 }))
      const there = state.piles[to]?.at(-1)
      void speak(there ? [nameOf(card), { pause: 300 }, nameOf(there)] : nameOf(card))
      return
    }
    setTurned(next.seen.filter((id) => !state.seen.includes(id)))
    playEffect('pop')
    if (isSetDone(next, to)) void speak([{ sound: 'correct' }, phrases.letterShort(getLetter(setOf(next, card)).spoken)])
  }

  /** A tap on a pile: pick up its top card, or put down the card picked up (a second tap on the same pile puts it back). */
  function tapPile(pile: number) {
    if (finished) return
    if (selected === null) pickUp(pile)
    else if (selected === pile) setSelected(null)
    else moveTo(selected, pile)
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const number = Number(event.key)
    if (Number.isInteger(number) && number >= 1 && number <= state.piles.length) tapPile(number - 1)
    else if (event.key === 'Escape') setSelected(null)
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (done) return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />

  // Layout, in screen pixels: a row of piles, the cards under the top one peeking out above it.
  const px = sceneScale(size.width, size.height)
  const groundTop = size.height - GROUND * px
  const count = state.piles.length
  const gap = Math.round(Math.max(10, Math.min(22, size.width * 0.016)))
  // As big as fits across, and down: a whole letter's pile with one more card on it, under its letter.
  const fitDown = (groundTop - 16 - TOP_BAR) / (1.42 + FACE_UP_STEP * params.cardsPerSet)
  const card = Math.floor(Math.min(MAX_CARD, (size.width - 48 - (count - 1) * gap) / count, fitDown))
  const tab = Math.round(card * 0.42)
  const boardTop = TOP_BAR + tab
  const boardLeft = Math.round((size.width - (count * card + (count - 1) * gap)) / 2)
  const room = groundTop - 16 - boardTop - card
  const pileX = (pile: number) => boardLeft + pile * (card + gap)
  /** Where each card lies in its pile, and how much of it shows: face-down cards close together, face-up ones further apart (squeezed if the pile gets tall). */
  const layout = (pile: readonly string[]) => {
    const steps = pile.slice(0, -1).map((id) => card * (state.seen.includes(id) ? FACE_UP_STEP : FACE_DOWN_STEP))
    const total = steps.reduce((sum, step) => sum + step, 0)
    const squeeze = total > room ? room / total : 1
    let y = 0
    return pile.map((id, k) => {
      const top = y
      const strip = (steps[k] ?? card) * squeeze
      y += strip
      return { id, top: Math.round(top), strip: k === pile.length - 1 ? undefined : Math.round(strip) }
    })
  }
  const pileAt = (clientX: number) => {
    const x = clientX - (sceneRef.current?.getBoundingClientRect().left ?? 0)
    const pile = Math.floor((x - boardLeft + gap / 2) / (card + gap))
    return pile >= 0 && pile < count ? pile : undefined
  }

  // Taps and drags come from the pointer events: a drag picks up the top card and puts it where it is let go.
  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, pile: number) {
    if (finished) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = { from: pile, x: event.clientX, y: event.clientY, moved: false }
  }
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current
    if (!start || !state.piles[start.from]?.length) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!start.moved && Math.hypot(dx, dy) < DRAG_PX) return
    if (!start.moved) {
      start.moved = true
      pickUp(start.from)
    }
    setDrag({ from: start.from, dx, dy })
  }
  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current
    dragStart.current = null
    if (!start) return
    if (!start.moved) return tapPile(start.from)
    setDrag(null)
    const target = pileAt(event.clientX)
    if (target === undefined || target === start.from) setSelected(null)
    else moveTo(start.from, target)
  }
  function handlePointerCancel() {
    dragStart.current = null
    setDrag(null)
    setSelected(null)
  }
  /** Enter or Space on a pile (a tap's own click is already handled, and so is the click after a drag). */
  function handleClick(event: MouseEvent<HTMLButtonElement>, pile: number) {
    if (event.detail === 0) tapPile(pile)
  }

  const setsDone = state.piles.filter((_, i) => isSetDone(state, i)).length

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--card': `${card}px` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling.
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
      </div>

      {state.piles.map((pile, i) => {
        const sorted = isSetDone(state, i)
        const letter = pileLetter(state, i) ?? (sorted ? setOf(state, pile[0]!) : undefined)
        return [
          pile.length === 0 && <span key={`empty-${i}`} className={styles.empty} style={{ left: pileX(i), top: boardTop }} />,
          letter && (
            <span
              key={`tab-${i}`}
              className={cx(styles.tab, sorted && styles.tabDone)}
              style={{ left: pileX(i) + (card - tab) / 2, top: boardTop - tab - 6, width: tab, height: tab }}
            >
              {getLetter(letter).display}
            </span>
          ),
        ]
      })}

      {/* All cards in one list, so a card that moves to another pile slides there. */}
      {state.piles.flatMap((pile, i) =>
        layout(pile).map(({ id, top, strip }, k) => {
          const isTop = k === pile.length - 1
          const dragged = isTop && drag?.from === i
          const shake = refused?.card === id
          const faceUp = state.seen.includes(id)
          const info = round.cards[id]!
          return (
            <div
              key={shake ? `${id}-${refused.count}` : id}
              className={cx(
                styles.card,
                faceUp && info.kind === 'picture' && styles.pictureFront,
                faceUp && strip !== undefined && styles.covered,
                isSetDone(state, i) && styles.sorted,
                isTop && selected === i && !drag && styles.lifted,
                dragged && styles.dragged,
                turned.includes(id) && styles.turned,
                shake && styles.shake,
              )}
              style={{
                left: pileX(i),
                top: boardTop + top,
                zIndex: dragged ? 100 : k + 1,
                transform: dragged ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.06)` : undefined,
                ...(strip !== undefined && ({ '--strip': `${strip}px` } as CSSProperties)),
              }}
            >
              {!faceUp ? (
                <PixelSprite grid={cardBack} className={styles.backArt} />
              ) : info.kind === 'letter' ? (
                getLetter(info.set).display
              ) : (
                <Picture word={info.word!} />
              )}
            </div>
          )
        }),
      )}

      {state.piles.map((pile, i) => {
        const top = pile.at(-1)
        return (
          <button
            key={i}
            type="button"
            className={styles.pile}
            style={{ left: pileX(i) - gap / 2, top: TOP_BAR, width: card + gap, height: groundTop - TOP_BAR }}
            aria-label={`Hög ${i + 1}: ${top ? nameOf(top).slice(0, -1) : 'tom'}`}
            aria-pressed={selected === i}
            onClick={(event) => handleClick(event, i)}
            onPointerDown={(event) => handlePointerDown(event, i)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          />
        )
      })}

      <div className={styles.top}>
        <ChallengeTopBar onExit={handleExit} onReplay={() => void speak(phrases.sortingIntro)} level={level} total={round.sets.length} current={setsDone} />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}
