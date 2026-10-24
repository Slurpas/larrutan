import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { words } from '../../content/words'
import { createSpellingRound, extraLetters, lettersOf, spellingWords } from './createRound'
import { hintBubble, nextLetter, nextWord, startSpelling, tapBubble } from './spellingState'

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
