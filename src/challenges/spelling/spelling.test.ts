import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { words } from '../../content/words'
import { lookAlikeRule } from '../difficulty'
import { levelParams, levelRule } from '../levels'
import { createRng } from '../random'
import { createSpellingRound, extraLetters, lettersOf, spellingWords, type SpellingRound } from './createRound'
import { hintBubble, nextLetter, nextWord, spellingScore, startSpelling, tapBubble, type SpellingState } from './spellingState'

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 3)
const idOf = new Map(letters.map((l) => [l.display, l.id]))
const lookAlike = (a: string, b: string) => {
  const [ia, ib] = [idOf.get(a), idOf.get(b)]
  return !!ia && !!ib && areConfusable(ia, ib, confusableLetters)
}

describe('the words to spell', () => {
  it('are the short approved words, 2–4 letters, at least 10 of them', () => {
    const list = spellingWords(words)
    expect(list.length).toBeGreaterThanOrEqual(10)
    for (const word of list) expect(word.base.length, word.base).toBeGreaterThanOrEqual(2)
    for (const word of list) expect(word.base.length, word.base).toBeLessThanOrEqual(4)
    expect(lettersOf(list.find((w) => w.base === 'lås')!)).toEqual(['L', 'Å', 'S'])
  })

  it('has enough longer words (4–5 letters) for the top level, with all their extra letters, none new', () => {
    const [shortest, longest] = levelParams('spelling', 4).lengths
    const list = spellingWords(words, [shortest, longest])
    expect(list.length).toBeGreaterThanOrEqual(10)
    for (const word of list) expect(word.base.length, word.base).toBeGreaterThanOrEqual(4)
    const { lookAlike, extraLetters: extras } = levelParams('spelling', 4)
    const shortLetters = new Set(spellingWords(words).flatMap(lettersOf))
    for (const seed of seeds)
      for (const q of createSpellingRound({ seed, words, difficulty: lookAlike ? 'hard' : 'easy', extras, lengths: [shortest, longest] }).questions) {
        const others = q.bubbles.map((b) => b.letter).filter((letter) => !q.letters.includes(letter))
        expect(others, `${seed} ${q.word}`).toHaveLength(extras)
        for (const letter of others) expect(shortLetters.has(letter), `${q.word}: ${letter}`).toBe(true)
      }
  })
})

describe('a Bygg ordet round', () => {
  it('has five different words, each with all its letters and some extra ones in the bubbles', () => {
    for (const seed of seeds)
      for (const difficulty of ['easy', 'hard'] as const) {
        const round = createSpellingRound({ seed, words, difficulty })
        expect(round.questions).toHaveLength(5)
        expect(new Set(round.questions.map((q) => q.word)).size).toBe(5)
        for (const q of round.questions) {
          const inBubbles = q.bubbles.map((b) => b.letter)
          for (const letter of q.letters) expect(inBubbles, `${seed} ${q.word}`).toContain(letter)
          const extras = inBubbles.length - q.letters.length
          expect(extras, `${seed} ${q.word}`).toBeLessThanOrEqual(extraLetters[difficulty])
          expect(extras, `${seed} ${q.word}`).toBeGreaterThanOrEqual(2)
          expect(new Set(q.bubbles.map((b) => b.id)).size).toBe(q.bubbles.length)
        }
      }
  })

  it('never offers an extra letter that looks like one in the word on the easy level', () => {
    for (const seed of seeds)
      for (const q of createSpellingRound({ seed, words }).questions) {
        const extras = q.bubbles.map((b) => b.letter).filter((letter) => !q.letters.includes(letter))
        for (const extra of extras) for (const letter of q.letters) expect(lookAlike(extra, letter), `${q.word}: ${extra}`).toBe(false)
      }
  })

  it('offers a look-alike on the hard level when the word has a letter with one', () => {
    let tricky = 0
    for (const seed of seeds)
      for (const q of createSpellingRound({ seed, words, difficulty: 'hard' }).questions) {
        const extras = q.bubbles.map((b) => b.letter).filter((letter) => !q.letters.includes(letter))
        if (extras.some((extra) => q.letters.some((letter) => lookAlike(extra, letter)))) tricky++
      }
    expect(tricky).toBeGreaterThan(100)
  })
})

describe('building a word', () => {
  const round = createSpellingRound({ seed: 5, words })
  const question = round.questions[0]!
  const bubbleWith = (letter: string, state = startSpelling(round)) =>
    question.bubbles.find((b) => b.letter === letter && !state.used.includes(b.id))!.id

  it('takes the letters in order and is done with the last one', () => {
    let state = startSpelling(round)
    for (const [i, letter] of question.letters.entries()) {
      expect(nextLetter(state)).toBe(letter)
      const tap = tapBubble(state, bubbleWith(letter, state))
      expect(tap.result).toBe('right')
      state = tap.state
      expect(state.built).toBe(i + 1)
    }
    expect(state.phase).toBe('built')
    expect(state.firstTry).toEqual([true])
    expect(nextWord(state).questionIndex).toBe(1)
  })

  it('greys out a letter that is not in the word, keeps a later one, and helps after two slips', () => {
    let state = startSpelling(round)
    const stranger = question.bubbles.find((b) => !question.letters.includes(b.letter))!
    let tap = tapBubble(state, stranger.id)
    expect(tap.result).toBe('wrong-letter')
    expect(tap.state.removed).toContain(stranger.id)
    state = tap.state
    expect(hintBubble(state)).toBeUndefined()
    const later = question.bubbles.find((b) => b.letter === question.letters.at(-1) && b.letter !== question.letters[0])
    if (later) {
      tap = tapBubble(state, later.id)
      expect(tap.result).toBe('not-yet')
      expect(tap.state.removed).not.toContain(later.id)
      state = tap.state
      expect(question.bubbles.find((b) => b.id === hintBubble(state))?.letter).toBe(question.letters[0])
    }
    // A greyed bubble can't be tapped again, and a wrong tap counts against first try, never against rewards.
    expect(tapBubble(state, stranger.id).result).toBe('ignored')
    for (const letter of question.letters) state = tapBubble(state, bubbleWith(letter, state)).state
    expect(state.firstTry).toEqual([false])
    expect(state.wrongTaps).toBeGreaterThan(0)
  })
})

/** Plays a round: `knows` is the chance the child taps the right bubble first; otherwise any bubble in play, until right. */
function playRound(round: SpellingRound, knows: number, seed: number): SpellingState {
  const rng = createRng(seed)
  let state = startSpelling(round)
  while (state.phase !== 'finished') {
    if (state.phase === 'built') {
      state = nextWord(state)
      continue
    }
    const question = round.questions[state.questionIndex]!
    const open = question.bubbles.filter((b) => !state.used.includes(b.id) && !state.removed.includes(b.id))
    const right = open.find((b) => b.letter === nextLetter(state))!
    const tapped = rng() < knows ? right : open[Math.floor(rng() * open.length)]!
    state = tapBubble(state, tapped.id).state
  }
  return state
}

describe('how well a round went', () => {
  const seeds100 = seeds.slice(0, 100)
  const average = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
  const roundAt = (seed: number, level: 1 | 2 | 3 | 4) => {
    const p = levelParams('spelling', level)
    return createSpellingRound({ seed, words, difficulty: lookAlikeRule(p.lookAlike), extras: p.extraLetters, lengths: p.lengths })
  }

  it('scores every letter found on the first tap as 1, and tapping at random about 0', () => {
    for (const level of [1, 2, 3, 4] as const) {
      expect(average(seeds100.map((seed) => spellingScore(playRound(roundAt(seed, level), 1, seed)))), `level ${level}`).toBe(1)
      expect(average(seeds100.map((seed) => spellingScore(playRound(roundAt(seed, level), 0, seed)))), `level ${level}`).toBeLessThan(levelRule.lowerAt)
    }
  })

  it('puts a child who finds most letters first time between going down and going up', () => {
    const scores = seeds100.map((seed) => spellingScore(playRound(roundAt(seed, 2), 0.6, seed)))
    expect(average(scores)).toBeGreaterThan(levelRule.lowerAt)
    expect(average(scores)).toBeLessThan(levelRule.raiseAt)
  })
})
