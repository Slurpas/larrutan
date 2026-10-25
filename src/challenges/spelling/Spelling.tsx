import { Fragment, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
import { phrases } from '../../content/phrases'
import { getWord, words } from '../../content/words'
import type { RoundOutcome } from '../../rewards/progress'
import { useProgress } from '../../rewards/store'
import { playEffect, speak, stopSpeech } from '../../speech/speech'
import { useVoiceStatus } from '../../speech/useVoiceStatus'
import { cx } from '../../ui/cx'
import { pixelBackground } from '../../ui/pixelImage'
import { PixelSprite } from '../../ui/PixelSprite'
import { Picture } from '../../ui/Picture'
import { ChallengeTopBar } from '../ChallengeTopBar'
import type { ChallengeScreenProps } from '../challengeProps'
import { lookAlikeRule } from '../difficulty'
import { levelIntro, levelParams } from '../levels'
import { RoundComplete } from '../RoundComplete'
import { sceneScale } from '../sceneScale'
import { createSpellingRound } from './createRound'
import { bubbleLayout } from './bubbleLayout'
import { currentWord, hintBubble, nextWord, spellingScore, startSpelling, tapBubble } from './spellingState'
import cards from '../ChoiceChallenge.module.css'
import styles from './Spelling.module.css'

const backgrounds = { meadowTop: pixelBackground(meadowTop), meadowSoil: pixelBackground(meadowSoil) }

/** The built word is celebrated (a happy sound, the word said) before the next one. */
const BUILT_MS = 1700
/** Room for the top bar above the word's slots. */
const TOP_BAR = 160
/** The meadow's height, in art pixels. */
const GROUND = 32

/**
 * Bygg ordet: the voice says a word ("Bygg ordet sol!"), its picture is next to the
 * speaker, and the child pops the bubbles with its letters in order to fill the slots.
 * The first level shows the word faintly in the slots; the next ones hide it, add an extra
 * letter that looks like one in the word, and then longer words (src/challenges/levels.ts).
 * A letter that isn't in the word turns grey; after a wrong tap the voice says the word
 * again and the next slot lights up, after two the right bubble does too. Nothing is timed.
 */
export function Spelling({ seed, level, announceLevel, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const params = levelParams('spelling', level)
  const [round] = useState(() =>
    createSpellingRound({
      seed,
      words,
      difficulty: lookAlikeRule(params.lookAlike),
      extras: params.extraLetters,
      lengths: params.lengths,
      practiceBox,
    }),
  )
  const [state, setState] = useState(() => startSpelling(round))
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const voiceStatus = useVoiceStatus()
  const outfit = useProgress().worn
  const blower = useMemo(() => bubbleBlower(outfit), [outfit])
  const question = currentWord(state)
  const word = question ? getWord(question.word) : undefined

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

  // Say each new word; the first round at a new level starts by saying what is harder.
  const ask = word ? phrases.spellingQuestion(word.base) : null
  const isFirst = state.questionIndex === 0
  const intro = announceLevel ? levelIntro('spelling', level) : undefined
  useEffect(() => {
    if (!ask) return
    void speak(isFirst && intro ? [intro, ask] : ask)
  }, [ask, isFirst, intro])
  useEffect(() => stopSpeech, [])

  // The word is built: a happy sound and the word, then the next one (or the end of the round).
  const finishRound = useEffectEvent(() => {
    const practiced = round.questions.map((q, i) => ({ item: q.word, firstTry: state.firstTry[i] ?? false }))
    setOutcome(onRoundComplete({ score: spellingScore(state), practiced }))
  })
  useEffect(() => {
    if (state.phase !== 'built' || !word) return
    void speak([{ sound: 'correct' }, phrases.firstLetterShort(word.base)])
    const isLast = state.questionIndex === round.questions.length - 1
    const timer = setTimeout(() => {
      if (isLast) finishRound()
      setState(nextWord)
    }, BUILT_MS)
    return () => clearTimeout(timer)
  }, [state.phase, state.questionIndex, round.questions.length, word])

  function tap(bubbleId: string) {
    if (!word) return
    const { state: next, result } = tapBubble(state, bubbleId)
    if (result === 'ignored') return
    setState(next)
    if (result === 'right') playEffect('pop')
    // Wrong: the word once more, short, so the child can listen for the sound they need.
    else if (next.phase === 'building') void speak(phrases.firstLetterShort(word.base))
  }

  function handleExit() {
    stopSpeech()
    onExit()
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!question || event.key.length !== 1) return
    const letter = event.key.toLocaleUpperCase('sv')
    const open = question.bubbles.filter((b) => b.letter === letter && !state.used.includes(b.id) && !state.removed.includes(b.id))
    if (open[0]) tap(open[0].id)
  })
  useLayoutEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  if (state.phase === 'finished' || !question || !word) {
    return <RoundComplete outcome={outcome} onPlayAgain={onPlayAgain} onExit={handleExit} />
  }

  // Layout, in screen pixels.
  const px = sceneScale(size.width, size.height)
  const bubblePx = bubbleSize * px
  const slotPx = Math.min(Math.round(bubblePx * 0.8), (size.width - 40) / question.letters.length - 12)
  const slotsTop = TOP_BAR
  const groundTop = size.height - GROUND * px
  const blowerLeft = Math.max(12 * px, size.width * 0.04)
  const blowerTop = groundTop - (outfitFeetRow - 2) * px
  const wand = { x: blowerLeft + wandRing.x * px, y: blowerTop + wandRing.y * px }
  const areaLeft = blowerLeft + (blower[0]?.length ?? 0) * px + 4 * px
  const areaTop = slotsTop + slotPx + 8 * px
  const area = { left: areaLeft, top: areaTop, width: size.width - areaLeft - 8 * px, height: groundTop - 6 * px - areaTop }
  const homes = bubbleLayout(question.bubbles.length, area, bubblePx, round.seed + state.questionIndex)
  const hint = hintBubble(state)
  const { showWord } = params

  const sprite = (grid: readonly string[], left: number, top: number) => (
    <PixelSprite
      grid={grid}
      className={styles.sprite}
      style={{ left, top, width: (grid[0]?.length ?? 0) * px, height: grid.length * px }}
    />
  )

  return (
    <main
      ref={sceneRef}
      className={styles.scene}
      style={{ '--px': `${px}px`, '--bubble': `${bubblePx}px`, '--slot': `${slotPx}px` } as CSSProperties}
      // Older Safari has no overflow: clip, so undo any scrolling (e.g. a focused bubble scrolled into view).
      onScroll={(event) => event.currentTarget.scrollTo(0, 0)}
    >
      {sprite(cloud, size.width * 0.08, TOP_BAR + slotPx + 2 * px)}
      {sprite(cloud, size.width * 0.72, TOP_BAR + slotPx - 4 * px)}
      <div className={styles.ground} style={{ top: groundTop }}>
        <div className={styles.grass} style={{ backgroundImage: backgrounds.meadowTop }} />
        <div className={styles.soil} style={{ backgroundImage: backgrounds.meadowSoil }} />
        {[0.32, 0.58, 0.86].map((x) => (
          <Fragment key={x}>{sprite(meadowFlower, size.width * x, -6 * px)}</Fragment>
        ))}
      </div>
      {sprite(blower, blowerLeft, blowerTop)}

      <div key={state.questionIndex} className={styles.bubbles}>
        {question.bubbles.map((bubble, i) => {
          const home = homes[i]
          if (!home) return null
          const isUsed = state.used.includes(bubble.id)
          const isRemoved = state.removed.includes(bubble.id)
          const leaving = state.phase === 'built'
          return (
            <button
              key={bubble.id}
              type="button"
              className={cx(
                styles.bubble,
                isRemoved && styles.removed,
                isUsed && styles.popped,
                leaving && !isUsed && styles.leaving,
              )}
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
              aria-label={bubble.letter}
              aria-hidden={isUsed || undefined}
              disabled={isRemoved || isUsed}
              onClick={() => tap(bubble.id)}
            >
              <span className={cx(styles.float, hint === bubble.id && styles.reveal)}>
                <PixelSprite grid={bubbleFill} className={styles.fill} />
                <PixelSprite grid={bubbleRing} className={styles.ring} />
                <span className={styles.letter}>{bubble.letter}</span>
              </span>
              {isUsed && <PixelSprite grid={bubbleBurst} className={styles.burst} />}
            </button>
          )
        })}
      </div>

      {/* The word being built: one slot per letter, in front of the bubbles floating away. */}
      <div className={styles.slots} style={{ top: slotsTop }} role="img" aria-label={`Ordet: ${question.letters.slice(0, state.built).join('')}`}>
        {question.letters.map((letter, i) => (
          <span
            key={i}
            className={cx(
              styles.slot,
              i < state.built && styles.filled,
              i === state.built && state.wrongInStep > 0 && styles.next,
              state.phase === 'built' && styles.done,
            )}
          >
            {i < state.built ? letter : showWord ? <span className={styles.faint}>{letter}</span> : null}
          </span>
        ))}
      </div>

      <div className={styles.top}>
        <ChallengeTopBar
          onExit={handleExit}
          onReplay={() => ask && void speak(ask)}
          level={level}
          total={round.questions.length}
          current={state.questionIndex}
          beside={
            <>
              <button
                type="button"
                className={styles.showcase}
                aria-label="Lyssna på ordet"
                onClick={() => void speak(phrases.firstLetterShort(word.base))}
              >
                <Picture word={word.id} />
              </button>
              {voiceStatus === 'missing' && <span className={cards.silentPrompt}>{word.base}</span>}
            </>
          }
        />
      </div>
      <p className={styles.seed}>#{round.seed}</p>
    </main>
  )
}
