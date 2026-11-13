import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { apple, appleSize, basketBack, basketFront, basketLeft, basketSize, basketSlots, inFrontRow, tree, treeSize, treeSpots } from '../../art/appleTree'
import { meadowSoil, meadowTop } from '../../art/bubbles'
import { numberWord } from '../../content/numbers'
import { phrases } from '../../content/phrases'
import type { RoundOutcome } from '../../rewards/progress'
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
import {
  appleScore,
  chooseNumber,
  countAll,
  currentQuestion,
  finishPicking,
  isRevealed,
  nextQuestion,
  onTree,
  pickApple,
  putBack,
  startApples,
  touchApple,
  type AppleState,
} from './appleTreeState'
import { countKey, createAppleRound, type AppleQuestion } from './createRound'
import cardStyles from '../ChoiceChallenge.module.css'
import styles from './AppleTree.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }
/** The meadow's height, in art pixels. */
const GROUND = 16
/** The tree and the basket beside it, in art pixels. */
const SCENE = { width: basketLeft + basketSize.width, height: treeSize.height }
/** A tap on an apple counts this far around it, in art pixels (the apple is 12 wide). */
const HIT = 15
/** The right answer stays green this long before the next tree. */
const CORRECT_MS = 1100
/** After the last number is said, a breath before the question. */
const QUESTION_PAUSE_MS = 400
/** An apple still falling (or flying back up) ignores taps: a quick second tap would send it straight back. */
const FLIGHT_MS = 600

const say = (n: number) => phrases.numberShort(numberWord(n))

/**
 * Äppelträdet, the first game in the town of maths (docs/MATHS_PLAN.md): counting things.
 * The child taps the apples on the tree; each drops into the basket and the game says the next
 * number ("Ett. Två. Tre."), so every apple gets exactly one number. When the tree is empty:
 * "Hur många?", and the child taps the number. Later the apples already lie in the basket, in
 * rows of five, and touching one gives it the next number; at the top level the child picks as
 * many as asked for ("Plocka sex äpplen!"), puts back any extra, and taps the tick. After a
 * wrong number or amount, the apples in the basket count themselves aloud, one by one.
 */
export function AppleTree({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const params = levelParams('appleTree', level)
  const [round] = useState(() => createAppleRound({ seed, ...params, practiceBox }))
  const [state, setState] = useState(() => startApples(round))
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [done, setDone] = useState(false)
  /** While the basket counts itself: how many of its apples show their number so far. */
  const [countedSoFar, setCountedSoFar] = useState<number | null>(null)
  const question = currentQuestion(state)
  const { mode } = round

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

  // Everything said goes through `talk`, which also stops the basket counting itself.
  const turn = useRef(0)
  /** The turn of the basket's latest count. */
  const countTurn = useRef(0)
  function talk(items: Utterance | readonly Utterance[]) {
    turn.current++
    void speak(items)
  }
  /**
   * The basket counts its apples aloud, each showing its number as it is said, then `after`.
   * Anything else said stops it, and then every number shows at once.
   */
  async function countBasket(next: AppleState, before: readonly Utterance[], after: readonly Utterance[]) {
    const mine = ++turn.current
    countTurn.current = mine
    setState(countAll(next))
    setCountedSoFar(0)
    const showAll = () => countTurn.current === mine && setCountedSoFar(null)
    await speak(before)
    for (let n = 1; n <= next.basket.length; n++) {
      if (turn.current !== mine) return showAll()
      setCountedSoFar(n)
      await speak(say(n))
    }
    showAll()
    if (turn.current === mine) await speak(after)
  }
  useEffect(() => stopSpeech, [])

  // The question, in full the first time the child ever plays, and short after that.
  const fullQuestion = !knowsChallenge && state.questionIndex === 0
  const howMany = (q: AppleQuestion, s: AppleState) => (isRevealed(s) ? phrases.hereIs(numberWord(q.count)) : fullQuestion ? phrases.appleQuestion : phrases.fruitShort)
  const pickRequest = (q: AppleQuestion) => phrases.pickApples(numberWord(q.count))

  // Each new tree: what to do (once a round), or the question, or how many to pick.
  const newLevel = announceLevel ? levelIntro('appleTree', level) : undefined
  const startQuestion = useEffectEvent((index: number) => {
    const q = round.questions[index]
    if (!q) return
    const first = index === 0
    const intro = first && newLevel ? [newLevel] : []
    if (mode === 'pick') {
      if (first) talk([...intro, knowsChallenge ? phrases.appleTreeShort : phrases.appleTreeIntro])
    } else if (mode === 'basket') talk([...intro, first && !knowsChallenge ? phrases.appleQuestion : phrases.fruitShort])
    else talk([...intro, pickRequest(q), ...(first && (newLevel || !knowsChallenge) ? [phrases.appleDoneHint] : [])])
  })
  useEffect(() => startQuestion(state.questionIndex), [state.questionIndex])

  // A right answer: a happy sound, a moment in green, then the next tree (or the end of the round).
  const finishRound = useEffectEvent((final: AppleState) => {
    const practiced = round.questions.map((q, i) => ({ item: countKey(q.count), firstTry: final.firstTry[i] ?? false }))
    setOutcome(onRoundComplete({ score: appleScore(final), practiced }))
    setDone(true)
  })
  useEffect(() => {
    if (state.phase !== 'correct') return
    let cancelled = false
    turn.current++
    void Promise.all([speak({ sound: 'correct' }), new Promise((resolve) => setTimeout(resolve, CORRECT_MS))]).then(() => {
      if (cancelled) return
      const next = nextQuestion(state)
      if (next.phase === 'finished') finishRound(next)
      else setState(next)
    })
    return () => {
      cancelled = true
    }
  }, [state])

  const movedAt = useRef(new Map<number, number>())
  function tapApple(id: number) {
    if (!question) return
    const now = performance.now()
    if (now - (movedAt.current.get(id) ?? -Infinity) < FLIGHT_MS) return
    if (state.phase === 'picking' && !state.basket.includes(id)) {
      const next = pickApple(state, id)
      if (next === state) return
      movedAt.current.set(id, now)
      setState(next)
      talk(next.phase === 'asking' ? [say(next.basket.length), { pause: QUESTION_PAUSE_MS }, howMany(question, next)] : say(next.basket.length))
    } else if (state.phase === 'picking') {
      const next = putBack(state, id)
      if (next === state) return
      movedAt.current.set(id, now)
      setState(next)
      if (next.basket.length > 0) talk(say(next.basket.length))
      else talk([])
    } else if (state.phase === 'asking') {
      // Touching an apple in the basket counts it; touching a counted one says its number again.
      const next = touchApple(state, id)
      setState(next)
      const number = next.counted.indexOf(id) + 1
      if (number > 0) talk(say(number))
    }
  }

  function chooseCard(choice: string) {
    if (!question) return
    const { state: next, result } = chooseNumber(state, choice)
    if (result === 'ignored') return
    setState(next)
    if (result === 'right') return
    // The first wrong number: the basket counts itself. After that, just the question again.
    if (state.removed.length === 0) void countBasket(next, [say(Number(choice)), { pause: WRONG_PAUSE_MS }], [{ pause: QUESTION_PAUSE_MS }, howMany(question, next)])
    else talk([say(Number(choice)), { pause: WRONG_PAUSE_MS }, howMany(question, next)])
  }

  function tapDone() {
    if (!question) return
    const { state: next, result } = finishPicking(state)
    if (result === 'ignored') {
      if (state.phase === 'picking') talk(pickRequest(question))
      return
    }
    setState(next)
    if (result !== 'right') void countBasket(next, [], [{ pause: QUESTION_PAUSE_MS }, result === 'tooMany' ? phrases.tooMany : phrases.tooFew, pickRequest(question)])
  }

  function replay() {
    if (!question) return
    if (state.phase === 'asking') talk(isRevealed(state) ? phrases.hereIs(numberWord(question.count)) : phrases.appleQuestion)
    else if (state.phase === 'picking') talk(mode === 'make' ? [pickRequest(question), phrases.appleDoneHint] : phrases.appleTreeIntro)
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  // Keys: a digit answers (0 is 10); arrow down picks an apple, arrow up puts one back; Enter is the tick.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (/^[0-9]$/.test(event.key)) chooseCard(event.key === '0' ? '10' : event.key)
    else if (event.key === 'ArrowDown' && onTree(state)[0] !== undefined) tapApple(onTree(state)[0]!)
    else if (event.key === 'ArrowUp' && mode === 'make' && state.basket.length > 0) tapApple(state.basket.at(-1)!)
    else if (event.key === 'Enter' && mode === 'make' && !(event.target instanceof HTMLButtonElement)) tapDone()
    else return
    event.preventDefault()
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (done || !question) return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />

  const layout = sceneLayout(size.width, size.height, question.choices.length)
  const { u, px } = layout
  const sceneLeft = layout.sceneLeft
  const sceneTop = layout.groundTop + px * 3 - SCENE.height * u
  const basketTop = SCENE.height - basketSize.height
  /** Where an apple's centre is, in screen pixels: on its tree spot, or in its place in the basket. */
  const appleAt = (id: number): [number, number, number] => {
    const slot = state.basket.indexOf(id)
    const [x, y] = slot >= 0 ? [basketLeft + basketSlots[slot]![0], basketTop + basketSlots[slot]![1]] : treeSpots[id]!
    return [sceneLeft + x * u, sceneTop + y * u, slot]
  }
  const apples = mode === 'basket' ? state.basket : question.spots
  const shownNumbers = countedSoFar ?? state.counted.length
  const celebrating = state.phase === 'correct'
  const art = (width: number, height: number, x: number, y: number): CSSProperties => ({ left: sceneLeft + x * u, top: sceneTop + y * u, width: width * u, height: height * u })

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--card-size': `${layout.card}px`, '--apple': `${appleSize.width * u}px` } as CSSProperties}
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      <div className={styles.ground} style={{ top: layout.groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
      </div>

      <PixelSprite grid={tree} className={cx(styles.art, styles.tree)} style={art(treeSize.width, treeSize.height, 0, 0)} />
      <PixelSprite grid={basketBack} className={cx(styles.art, styles.basketBack)} style={art(basketSize.width, basketSize.height, basketLeft, basketTop)} />
      <PixelSprite grid={basketFront} className={cx(styles.art, styles.basketFront)} style={art(basketSize.width, basketSize.height, basketLeft, basketTop)} />

      {apples.map((id) => {
        const [x, y, slot] = appleAt(id)
        const number = state.counted.indexOf(id) + 1
        const where = slot >= 0 ? 'basket' : 'tree'
        return (
          <button
            key={`${state.questionIndex}-${id}`}
            type="button"
            className={cx(styles.apple, where === 'tree' ? styles.onTree : inFrontRow(slot) ? styles.frontRow : styles.backRow, mode === 'basket' && styles.inBasketFromStart)}
            aria-label="Äpple"
            data-apple={id}
            data-where={where}
            disabled={celebrating}
            style={{ left: x - (HIT * u) / 2, top: y - (HIT * u) / 2, width: HIT * u, height: HIT * u }}
            onClick={() => tapApple(id)}
          >
            <PixelSprite grid={apple} className={styles.appleArt} style={{ width: appleSize.width * u, height: appleSize.height * u }} />
            {number > 0 && number <= shownNumbers && (
              <span className={styles.number} data-number={number}>
                {number}
              </span>
            )}
          </button>
        )
      })}

      <div className={cx(styles.panel, layout.beside ? styles.beside : styles.above)} style={layout.panel}>
        {mode === 'pick' && state.phase === 'picking' && state.basket.length > 0 && (
          <span key={state.basket.length} className={styles.count} data-count={state.basket.length} role="img" aria-label={`${state.basket.length} äpplen`}>
            {state.basket.length}
          </span>
        )}

        {mode === 'make' && (
          <>
            <span className={cx(styles.want, celebrating && styles.solved)} role="img" aria-label={`${question.count} äpplen`}>
              {question.count}
              <PixelSprite grid={apple} className={styles.wantApple} />
            </span>
            <button type="button" className={cx(styles.done, celebrating && styles.doneCorrect)} aria-label="Klar" disabled={celebrating} onClick={tapDone}>
              <CheckIcon />
            </button>
          </>
        )}

        {(state.phase === 'asking' || (celebrating && mode !== 'make')) && (
          <div className={styles.choices} style={{ '--columns': layout.beside && question.choices.length > 3 ? 2 : layout.beside ? 1 : question.choices.length } as CSSProperties}>
            {question.choices.map((choice) => {
              const removed = state.removed.includes(choice)
              const right = celebrating && choice === question.target
              return (
                <button
                  key={`${state.questionIndex}-${choice}`}
                  type="button"
                  className={cx(
                    cardStyles.card,
                    removed && cardStyles.removed,
                    right && cardStyles.correct,
                    celebrating && !right && cardStyles.faded,
                    isRevealed(state) && choice === question.target && cardStyles.reveal,
                  )}
                  aria-label={choice}
                  disabled={removed || celebrating}
                  onClick={() => chooseCard(choice)}
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
        )}
      </div>

      <div className={styles.top}>
        <ChallengeTopBar onExit={handleExit} onReplay={replay} level={level} total={round.questions.length} current={state.questionIndex} />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}

/**
 * Where everything goes, in screen pixels: the tree and its basket standing on the meadow, as big
 * as fits, and the panel (the count, the number cards, the tick) beside them on a wide screen
 * or above them on a tall one, whichever leaves the tree bigger. `u` is one art pixel.
 */
function sceneLayout(width: number, height: number, choices: number) {
  const px = sceneScale(width, height)
  const groundTop = height - GROUND * px
  const top = Math.min(140, Math.round(height * 0.19))
  const gap = 16
  const card = Math.max(84, Math.min(120, Math.round(Math.min(width, height) * 0.14)))
  const room = groundTop - top
  const besideWidth = (choices > 3 ? 2 : 1) * card + 3 * gap
  const aboveHeight = card + 2 * gap
  const uBeside = Math.min(room / SCENE.height, (width - besideWidth - 2 * gap) / SCENE.width)
  const uAbove = Math.min((room - aboveHeight) / SCENE.height, (width - 2 * gap) / SCENE.width)
  const beside = uBeside >= uAbove
  const u = Math.max(1, Math.min(7, beside ? uBeside : uAbove))
  const sceneWidth = SCENE.width * u
  if (beside) {
    const sceneLeft = Math.round(gap + (width - besideWidth - 2 * gap - sceneWidth) / 2)
    const panelLeft = sceneLeft + sceneWidth + gap
    return { u, px, card, groundTop, beside, sceneLeft, panel: { left: panelLeft, top, width: width - panelLeft - gap, height: room } }
  }
  const sceneLeft = Math.round((width - sceneWidth) / 2)
  const sceneTop = groundTop + px * 3 - SCENE.height * u
  return { u, px, card, groundTop, beside, sceneLeft, panel: { left: 0, top, width, height: Math.max(aboveHeight, sceneTop - top) } }
}
