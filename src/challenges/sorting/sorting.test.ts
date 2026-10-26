import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { alsoCalledLetters } from '../../content/validation'
import { getWord, words } from '../../content/words'
import { lookAlikeRule } from '../difficulty'
import { levelParams, levelRule, type Level } from '../levels'
import { createRng } from '../random'
import { createSortingRound, freePiles, type SortingRound } from './createRound'
import { canMove, isFinished, isSetDone, moveCard, pileLetter, setOf, solve, sortingScore, startSorting } from './sortingState'

const seeds = Array.from({ length: 150 }, (_, i) => i * 7919 + 3)
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const looks = confusableLetters.filter((group) => group.reason === 'looks')
const roundAt = (seed: number, level: Level) => {
  const { sets, cardsPerSet, lookAlikes } = levelParams('sorting', level)
  return createSortingRound({ seed, words, letters, confusables: confusableLetters, sets, cardsPerSet, difficulty: lookAlikeRule(lookAlikes) })
}

describe('a Sortera korten round', () => {
  it('has a letter and its pictures for each set, dealt into mixed piles, and two empty ones', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const { sets, cardsPerSet } = levelParams('sorting', level)
        const round = roundAt(seed, level)
        expect(round.sets).toHaveLength(sets)
        expect(new Set(round.sets).size).toBe(sets)
        expect(Object.keys(round.cards)).toHaveLength(sets * cardsPerSet)
        for (const set of round.sets) {
          const cards = Object.values(round.cards).filter((card) => card.set === set)
          expect(cards.filter((card) => card.kind === 'letter'), `${seed} ${set}`).toHaveLength(1)
          for (const card of cards.filter((c) => c.kind === 'picture')) expect(getWord(card.word!).firstLetter).toBe(set)
        }
        expect(round.piles).toHaveLength(sets + freePiles)
        expect(round.piles.slice(sets).every((pile) => pile.length === 0)).toBe(true)
        for (const pile of round.piles.slice(0, sets)) {
          expect(pile).toHaveLength(cardsPerSet)
          expect(new Set(pile.map((id) => round.cards[id]!.set)).size, `${seed} ${level}: a pile starts sorted`).toBeGreaterThan(1)
        }
      }
  })

  it('has no letters easy to mix up until the look-alike levels, then two that look alike', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const round = roundAt(seed, level)
        if (levelParams('sorting', level).lookAlikes) {
          expect(round.sets.some((a) => round.sets.some((b) => a !== b && areConfusable(a, b, looks))), `${seed} ${level}`).toBe(true)
        } else {
          for (const a of round.sets) for (const b of round.sets) if (a !== b) expect(areConfusable(a, b, confusableLetters), `${seed}: ${a} ${b}`).toBe(false)
        }
      }
  })

  it('never has a picture that another name links to another set (the train, "lok", and L)', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const round = roundAt(seed, level)
        for (const card of Object.values(round.cards).filter((c) => c.kind === 'picture')) {
          for (const other of alsoCalledLetters(getWord(card.word!), letters)) {
            if (other !== card.set) expect(round.sets, `${seed} ${card.word}`).not.toContain(other)
          }
        }
      }
  })

  it('is the same for the same seed', () => {
    expect(roundAt(42, 4)).toEqual(roundAt(42, 4))
  })
})

describe('moving cards', () => {
  /** A small round by hand: A (anka) and S (sol), all on two piles, two empty. */
  const round: SortingRound = {
    seed: 1,
    sets: ['a', 's'],
    cards: {
      'letter-a': { id: 'letter-a', kind: 'letter', set: 'a' },
      'picture-duck': { id: 'picture-duck', kind: 'picture', set: 'a', word: 'duck' },
      'letter-s': { id: 'letter-s', kind: 'letter', set: 's' },
      'picture-sun': { id: 'picture-sun', kind: 'picture', set: 's', word: 'sun' },
    },
    piles: [['letter-a', 'picture-sun'], ['letter-s', 'picture-duck'], [], []],
  }

  it('lets a top card onto an empty pile or one of its own letter, and nowhere else', () => {
    const state = startSorting(round, true)
    expect(canMove(state, 0, 2)).toBe(true)
    expect(canMove(state, 0, 1)).toBe(false)
    const wrong = moveCard(state, 0, 1)
    expect(wrong.result).toBe('wrong')
    expect(wrong.state.piles).toEqual(state.piles)
    expect(wrong.state.slipped).toEqual(['picture-sun'])
    expect(moveCard(state, 2, 0).result).toBe('ignored')
  })

  it('uncovers the card underneath, labels a pile with its letter, and finishes when every letter has its pile', () => {
    let state = startSorting(round, true)
    expect(state.seen).toEqual(['picture-sun', 'picture-duck'])
    state = moveCard(state, 0, 2).state // sol to an empty pile: A is uncovered
    expect(state.seen).toContain('letter-a')
    expect(pileLetter(state, 0)).toBe('a')
    state = moveCard(state, 1, 0).state // anka onto A
    expect(isSetDone(state, 0)).toBe(true)
    expect(pileLetter(state, 0)).toBe('a')
    expect(isFinished(state)).toBe(false)
    state = moveCard(state, 2, 1).state // sol onto S
    expect(isFinished(state)).toBe(true)
    // Moves onto an empty pile don't count; the one onto A had a 1 in 2 chance (A or the empty-free S pile).
    expect(state.drops).toBe(2)
    expect(sortingScore(state)).toBe(1)
  })

  it('shows a letter above its pile only once the letter card has been seen, and turns a finished pile face up', () => {
    // A face down under anka and S; apa (also A) on a pile of its own.
    const hiddenLetter: SortingRound = {
      ...round,
      cards: { ...round.cards, 'picture-monkey': { id: 'picture-monkey', kind: 'picture', set: 'a', word: 'monkey' } },
      piles: [['letter-a', 'picture-duck', 'letter-s'], ['picture-sun'], ['picture-monkey'], [], []],
    }
    let state = startSorting(hiddenLetter, true)
    state = moveCard(state, 0, 1).state // S onto sol: anka shows, A is still face down
    expect(state.seen).toContain('picture-duck')
    expect(state.seen).not.toContain('letter-a')
    expect(pileLetter(state, 0)).toBeUndefined()
    state = moveCard(state, 2, 0).state // apa onto anka: every A card is there, so A turns face up
    expect(isSetDone(state, 0)).toBe(true)
    expect(state.seen).toContain('letter-a')
    expect(pileLetter(state, 0)).toBe('a')
  })

  it('can always be sorted: a solution for every deal, at every level', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const round = roundAt(seed, level)
        const moves = solve(round)
        expect(moves.length, `${seed} ${level}`).toBeGreaterThan(0)
        let state = startSorting(round, true)
        for (const [from, to] of moves) {
          const step = moveCard(state, from, to)
          expect(step.result, `${seed} ${level}`).toBe('moved')
          state = step.state
        }
        expect(isFinished(state), `${seed} ${level}`).toBe(true)
        expect(sortingScore(state)).toBe(1)
      }
  })

  it('scores dropping cards on random piles near 0', () => {
    const rng = createRng(7)
    const scores = seeds.slice(0, 60).map((seed) => {
      let state = startSorting(roundAt(seed, 3), true)
      for (let i = 0; i < 40; i++) {
        const from = Math.floor(rng() * state.piles.length)
        const to = Math.floor(rng() * state.piles.length)
        if (state.piles[to]!.length > 0) state = moveCard(state, from, to).state
      }
      return sortingScore(state)
    })
    expect(scores.reduce((sum, s) => sum + s, 0) / scores.length).toBeLessThan(levelRule.lowerAt)
    expect(setOf(startSorting(roundAt(1, 1), false), 'nothing')).toBe('')
  })
})
