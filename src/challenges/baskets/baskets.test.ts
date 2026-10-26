import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, getLetter, letters } from '../../content/letters'
import { alsoCalledLetters } from '../../content/validation'
import { getWord, words } from '../../content/words'
import { lookAlikeRule } from '../difficulty'
import { levelParams, levelRule, type Level } from '../levels'
import { createRng } from '../random'
import { basketsScore, dropInBasket, isBasketFull, isFinished, startBaskets, type BasketsState } from './basketsState'
import { createBasketsRound, type BasketsRound } from './createRound'

const seeds = Array.from({ length: 150 }, (_, i) => i * 7919 + 3)
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const looks = confusableLetters.filter((group) => group.reason === 'looks')
const roundAt = (seed: number, level: Level) => {
  const { sets, picturesPerSet, piles, lookAlikes } = levelParams('baskets', level)
  return createBasketsRound({ seed, words, letters, confusables: confusableLetters, sets, picturesPerSet, piles, difficulty: lookAlikeRule(lookAlikes) })
}

describe('a Bokstavskorgarna round', () => {
  it('has a basket for each letter, in alphabet order, and its pictures dealt into piles of one size', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const { sets, picturesPerSet, piles } = levelParams('baskets', level)
        const round = roundAt(seed, level)
        expect(round.sets).toHaveLength(sets)
        expect(new Set(round.sets).size).toBe(sets)
        expect([...round.sets].sort((a, b) => getLetter(a).display.localeCompare(getLetter(b).display, 'sv'))).toEqual(round.sets)
        for (const set of round.sets) {
          const pictures = Object.values(round.cards).filter((card) => card.set === set)
          expect(pictures, `${seed} ${level} ${set}`).toHaveLength(picturesPerSet)
          for (const card of pictures) expect(getWord(card.word).firstLetter).toBe(set)
        }
        expect(round.piles).toHaveLength(piles)
        expect(round.piles.flat().sort()).toEqual(Object.keys(round.cards).sort())
        expect(new Set(round.piles.map((pile) => pile.length)).size, `${seed} ${level}`).toBe(1)
      }
  })

  it('has no letters easy to mix up, except two that look alike on the look-alike level', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const round = roundAt(seed, level)
        if (levelParams('baskets', level).lookAlikes) {
          expect(round.sets.some((a) => round.sets.some((b) => a !== b && areConfusable(a, b, looks))), `${seed} ${level}`).toBe(true)
        } else {
          for (const a of round.sets) for (const b of round.sets) if (a !== b) expect(areConfusable(a, b, confusableLetters), `${seed}: ${a} ${b}`).toBe(false)
        }
      }
  })

  it('never has a picture that another name links to another basket (the train, "lok", and L)', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const round = roundAt(seed, level)
        for (const card of Object.values(round.cards)) {
          for (const other of alsoCalledLetters(getWord(card.word), letters)) {
            if (other !== card.set) expect(round.sets, `${seed} ${card.word}`).not.toContain(other)
          }
        }
      }
  })

  it('is the same for the same seed', () => {
    expect(roundAt(42, 4)).toEqual(roundAt(42, 4))
  })
})

describe('putting pictures in baskets', () => {
  /** A small round by hand: A (anka, apa) and S (sol, sax), in two piles. */
  const round: BasketsRound = {
    seed: 1,
    sets: ['a', 's'],
    cards: {
      'picture-duck': { id: 'picture-duck', set: 'a', word: 'duck' },
      'picture-monkey': { id: 'picture-monkey', set: 'a', word: 'monkey' },
      'picture-sun': { id: 'picture-sun', set: 's', word: 'sun' },
      'picture-scissors': { id: 'picture-scissors', set: 's', word: 'scissors' },
    },
    piles: [
      ['picture-duck', 'picture-sun'],
      ['picture-scissors', 'picture-monkey'],
    ],
  }

  it('takes a picture only in the basket of its first letter, and uncovers the one underneath', () => {
    const state = startBaskets(round, true)
    expect(state.seen).toEqual(['picture-sun', 'picture-monkey'])
    const wrong = dropInBasket(state, 0, 'a')
    expect(wrong.result).toBe('wrong')
    expect(wrong.state.piles).toEqual(state.piles)
    expect(wrong.state.slipped).toEqual(['picture-sun'])
    expect(dropInBasket(state, 0, 'm').result).toBe('ignored')
    const right = dropInBasket(state, 0, 's')
    expect(right.result).toBe('right')
    expect(right.state.baskets.s).toEqual(['picture-sun'])
    expect(right.state.piles[0]).toEqual(['picture-duck'])
    expect(right.state.seen).toContain('picture-duck')
  })

  it('fills the baskets, and is done when the piles are empty', () => {
    let state = startBaskets(round, false)
    for (const [pile, set] of [
      [0, 's'],
      [0, 'a'],
      [1, 'a'],
    ] as const)
      state = dropInBasket(state, pile, set).state
    expect(isBasketFull(state, 'a')).toBe(true)
    expect(isBasketFull(state, 's')).toBe(false)
    expect(isFinished(state)).toBe(false)
    state = dropInBasket(state, 1, 's').state
    expect(isBasketFull(state, 's')).toBe(true)
    expect(isFinished(state)).toBe(true)
    expect(basketsScore(state)).toBe(1)
    expect(dropInBasket(state, 0, 'a').result).toBe('ignored')
  })

  /** Plays a round: each top picture goes in a basket picked by `choose`, until the piles are empty. */
  const play = (state: BasketsState, choose: (set: string, rng: () => number) => string, rng: () => number) => {
    while (!isFinished(state)) {
      const pile = state.piles.findIndex((cards) => cards.length > 0)
      const card = state.round.cards[state.piles[pile]!.at(-1)!]!
      state = dropInBasket(state, pile, choose(card.set, rng)).state
    }
    return state
  }

  it('scores guessing near 0, and one slip on the top level still high enough to stay', () => {
    const rng = createRng(7)
    const guesses = seeds.slice(0, 60).map((seed) => {
      const level = roundAt(seed, 3)
      return basketsScore(play(startBaskets(level, true), (_, r) => level.sets[Math.floor(r() * level.sets.length)]!, rng))
    })
    expect(guesses.reduce((sum, s) => sum + s, 0) / guesses.length).toBeLessThan(levelRule.lowerAt)

    const top = roundAt(1, 4)
    let slipped = false
    const careful = play(
      startBaskets(top, true),
      (set) => {
        if (slipped) return set
        slipped = true
        return top.sets.find((other) => other !== set)!
      },
      rng,
    )
    expect(careful.slipped).toHaveLength(1)
    expect(basketsScore(careful)).toBeGreaterThanOrEqual(levelRule.raiseAt)
  })
})
