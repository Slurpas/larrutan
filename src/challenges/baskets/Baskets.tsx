import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { basket, basketSize } from '../../art/baskets'
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
import { basketsScore, dropInBasket, isBasketFull, isFinished, startBaskets } from './basketsState'
import { createBasketsRound } from './createRound'
import styles from './Baskets.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }
/** Room for the top bar above the piles (and a picture lifted from them). */
const TOP_BAR = 160
/** The meadow's height, in art pixels; in portrait at least this many screen pixels, so the iPad's hint to turn it (src/app/RotateHint.tsx) covers soil, not a basket. */
const GROUND = 20
const PORTRAIT_GROUND = 150
/** The biggest a card and a basket get, in screen pixels. */
const MAX_CARD = 150
const MAX_BASKET = 240
/** How much of a card shows under the next one: face up, and face down, as parts of a card. */
const FACE_UP_STEP = 0.52
const FACE_DOWN_STEP = 0.16
/** A picture in a basket, as a part of the basket's width, and how much of it sticks up over the rim. */
const IN_BASKET = 0.3
const OVER_RIM = 0.66
/** The pictures in a basket lean a little, each its own way. */
const LEAN = [-8, 5, -3, 9]
/** The last basket filled is enjoyed for a moment before the round ends. */
const FINISH_MS = 1800
/** A drag shorter than this is a tap. */
const DRAG_PX = 12

interface Drag {
  from: number
  dx: number
  dy: number
}

/**
 * Bokstavskorgarna: a basket for each letter stands on the meadow from the start, and the
 * pictures lie in piles above them. Tap a pile to pick up its top picture (its name is said),
 * then tap the basket of the letter its word starts with; or drag it there. In the wrong
 * basket it comes back, and the picture and the basket's letter are named. Tapping a basket
 * says its letter. From the second level only the top pictures start face up. Done when every
 * picture is in its basket. Nothing is timed.
 */
export function Baskets({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const params = levelParams('baskets', level)
  const [round] = useState(() =>
    createBasketsRound({
      seed,
      words,
      letters,
      confusables: confusableLetters,
      sets: params.sets,
      picturesPerSet: params.picturesPerSet,
      piles: params.piles,
      difficulty: lookAlikeRule(params.lookAlikes),
      practiceBox,
    }),
  )
  const [state, setState] = useState(() => startBaskets(round, params.hidden))
  const [selected, setSelected] = useState<number | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  /** Pictures turned face up by the last move: they turn over. */
  const [turned, setTurned] = useState<readonly string[]>([])
  /** The picture just refused, and a counter so the shake can repeat. */
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
  const newLevel = announceLevel ? levelIntro('baskets', level) : undefined
  useEffect(() => {
    const intro = knowsChallenge ? phrases.basketsShort : phrases.basketsIntro
    void speak(newLevel ? [newLevel, intro] : intro)
  }, [knowsChallenge, newLevel])
  useEffect(() => stopSpeech, [])

  // Every picture is in its basket: a moment to enjoy it, then the round is done.
  const finishRound = useEffectEvent(() => {
    const practiced = Object.values(round.cards).map((card) => ({ item: card.word, firstTry: !state.slipped.includes(card.id) }))
    setOutcome(onRoundComplete({ score: basketsScore(state), practiced }))
    setDone(true)
  })
  const finished = isFinished(state)
  useEffect(() => {
    if (!finished) return
    const timer = setTimeout(finishRound, FINISH_MS)
    return () => clearTimeout(timer)
  }, [finished])

  const pictureName = (cardId: string) => phrases.firstLetterShort(getWord(round.cards[cardId]!.word).base)
  const letterName = (set: string) => phrases.letterShort(getLetter(set).spoken)

  function pickUp(pile: number) {
    const top = state.piles[pile]?.at(-1)
    if (!top) return
    setSelected(pile)
    void speak(pictureName(top))
  }

  function drop(pile: number, set: string) {
    setSelected(null)
    const card = state.piles[pile]?.at(-1)
    const { state: next, result } = dropInBasket(state, pile, set)
    if (result === 'ignored' || !card) return
    setState(next)
    if (result === 'wrong') {
      // It comes back; the picture and the letter are named, so the child hears that they don't start alike.
      setRefused((r) => ({ card, count: (r?.count ?? 0) + 1 }))
      void speak([pictureName(card), { pause: 300 }, letterName(set)])
      return
    }
    setTurned(next.seen.filter((id) => !state.seen.includes(id)))
    playEffect('pop')
    if (isBasketFull(next, set)) void speak([{ sound: 'correct' }, letterName(set)])
  }

  /** A tap on a pile picks up its top picture (again on the same pile puts it back); on a basket, puts it there, or says the basket's letter. */
  function tapPile(pile: number) {
    if (finished) return
    if (selected === pile) setSelected(null)
    else pickUp(pile)
  }
  function tapBasket(set: string) {
    if (finished) return
    if (selected === null) void speak(letterName(set))
    else drop(selected, set)
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  // Keys: 1–9 pick up from a pile, a letter puts the picture in that letter's basket.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const number = Number(event.key)
    const set = round.sets.find((id) => getLetter(id).display.toLocaleLowerCase('sv') === event.key.toLocaleLowerCase('sv'))
    if (Number.isInteger(number) && number >= 1 && number <= state.piles.length) tapPile(number - 1)
    else if (set) tapBasket(set)
    else if (event.key === 'Escape') setSelected(null)
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (done) return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />

  // Layout, in screen pixels: the baskets standing on the meadow, the piles above them.
  const px = sceneScale(size.width, size.height)
  const groundTop = size.height - Math.max(GROUND * px, size.height > size.width ? PORTRAIT_GROUND : 0)
  const sets = round.sets.length
  const basketGap = Math.round(Math.max(16, Math.min(40, size.width * 0.03)))
  const bp = Math.max(2, Math.floor(Math.min(MAX_BASKET, (size.width - 48 - (sets - 1) * basketGap) / sets) / basketSize.width))
  const basketW = basketSize.width * bp
  const basketH = basketSize.height * bp
  const basketTop = groundTop + 4 * px - basketH
  const basketsLeft = Math.round((size.width - (sets * basketW + (sets - 1) * basketGap)) / 2)
  const basketX = (b: number) => basketsLeft + b * (basketW + basketGap)
  const small = Math.round(basketW * IN_BASKET)
  const smallTop = basketTop - Math.round(small * OVER_RIM)

  const count = round.piles.length
  const deepest = Math.max(...round.piles.map((pile) => pile.length))
  const fan = 1 + (deepest - 1) * (params.hidden ? FACE_DOWN_STEP : FACE_UP_STEP)
  const gap = Math.round(Math.max(10, Math.min(22, size.width * 0.016)))
  const card = Math.floor(Math.min(MAX_CARD, (size.width - 48 - (count - 1) * gap) / count, (smallTop - 24 - TOP_BAR) / fan))
  const pilesLeft = Math.round((size.width - (count * card + (count - 1) * gap)) / 2)
  const pileX = (pile: number) => pilesLeft + pile * (card + gap)
  /** Where the baskets' tap area starts: under the deepest pile. */
  const basketsArea = Math.round(TOP_BAR + card * fan + Math.min(40, (smallTop - TOP_BAR - card * fan) / 2))

  /** Where every picture is, and how big. */
  const placed = [
    ...state.piles.flatMap((pile, i) => {
      let y = TOP_BAR
      return pile.map((id, k) => {
        const top = y
        y += card * (state.seen.includes(id) ? FACE_UP_STEP : FACE_DOWN_STEP)
        return { id, left: pileX(i), top: Math.round(top), size: card, z: 20 + k, pile: i, isTop: k === pile.length - 1, lean: 0 }
      })
    }),
    ...round.sets.flatMap((set, b) => {
      const inset = Math.round(basketW * 0.04)
      const spacing = params.picturesPerSet > 1 ? (basketW - 2 * inset - small) / (params.picturesPerSet - 1) : 0
      return state.baskets[set]!.map((id, j) => ({
        id,
        left: Math.round(basketX(b) + (params.picturesPerSet > 1 ? inset + j * spacing : (basketW - small) / 2)),
        top: smallTop + (j % 2) * Math.round(small * 0.06),
        size: small,
        z: 5 + j,
        pile: undefined,
        isTop: false,
        lean: LEAN[j % LEAN.length]!,
        set,
      }))
    }),
  ]
  // Sorted by id, so a picture keeps its place among the elements as it moves and can slide into its basket.
  placed.sort((a, b) => a.id.localeCompare(b.id))

  // Taps and drags come from the pointer events: a drag picks up the top picture and puts it where it is let go.
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
      if (selected !== start.from) pickUp(start.from)
    }
    setDrag({ from: start.from, dx, dy })
  }
  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const start = dragStart.current
    dragStart.current = null
    if (!start) return
    if (!start.moved) return tapPile(start.from)
    setDrag(null)
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-basket]')?.dataset.basket
    if (target) drop(start.from, target)
    else setSelected(null)
  }
  function handlePointerCancel() {
    dragStart.current = null
    setDrag(null)
    setSelected(null)
  }
  /**
   * Enter or Space on a pile. A tap's own click is already handled, and so is the click after
   * a drag, wherever the browser sends it (so baskets, too, take taps from `pointerup`).
   */
  function handlePileClick(event: MouseEvent<HTMLButtonElement>, pile: number) {
    if (event.detail === 0) tapPile(pile)
  }

  const basketsFull = round.sets.filter((set) => isBasketFull(state, set)).length

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling.
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
      </div>

      {round.sets.map((set, b) => (
        <div
          key={set}
          className={cx(styles.basket, isBasketFull(state, set) && styles.full)}
          style={{ left: basketX(b), top: basketTop, width: basketW, height: basketH }}
        >
          <PixelSprite grid={basket} className={styles.basketArt} />
          <span className={styles.tag} style={{ fontSize: Math.round(basketH * 0.44) }}>
            {getLetter(set).display}
          </span>
        </div>
      ))}

      {placed.map(({ id, left, top, size: side, z, pile, isTop, lean, ...rest }) => {
        const dragged = isTop && drag !== null && drag.from === pile
        const shake = refused?.card === id
        const faceUp = state.seen.includes(id)
        const full = 'set' in rest && isBasketFull(state, rest.set)
        return (
          <div
            key={shake ? `${id}-${refused.count}` : id}
            className={cx(
              styles.card,
              isTop && selected === pile && !drag && styles.lifted,
              dragged && styles.dragged,
              turned.includes(id) && styles.turned,
              shake && styles.shake,
              full && styles.full,
            )}
            style={{
              left,
              top,
              width: side,
              height: side,
              fontSize: Math.round(side * 0.56),
              zIndex: dragged ? 100 : z,
              transform: dragged ? `translate(${drag.dx}px, ${drag.dy}px) scale(1.06)` : lean ? `rotate(${lean}deg)` : undefined,
            }}
          >
            {faceUp ? <Picture word={round.cards[id]!.word} /> : <PixelSprite grid={cardBack} className={styles.backArt} />}
          </div>
        )
      })}

      {state.piles.map((pile, i) => {
        const top = pile.at(-1)
        return (
          <button
            key={i}
            type="button"
            className={styles.target}
            style={{ left: pileX(i) - gap / 2, top: TOP_BAR, width: card + gap, height: basketsArea - TOP_BAR }}
            aria-label={`Hög ${i + 1}: ${top ? pictureName(top).slice(0, -1) : 'tom'}`}
            aria-pressed={selected === i}
            onClick={(event) => handlePileClick(event, i)}
            onPointerDown={(event) => handlePointerDown(event, i)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          />
        )
      })}
      {round.sets.map((set, b) => (
        <button
          key={set}
          type="button"
          className={styles.target}
          data-basket={set}
          style={{ left: basketX(b) - basketGap / 2, top: basketsArea, width: basketW + basketGap, height: size.height - basketsArea }}
          aria-label={`Korg ${getLetter(set).display}`}
          onClick={(event) => event.detail === 0 && tapBasket(set)}
          onPointerUp={() => tapBasket(set)}
        />
      ))}

      <div className={styles.top}>
        <ChallengeTopBar onExit={handleExit} onReplay={() => void speak(phrases.basketsIntro)} level={level} total={sets} current={basketsFull} />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}
