import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { getWord, words } from '../../content/words'
import { createMemoryRound, pairCounts } from './createRound'
import { closeCards, isFinished, startMemory, turnCard } from './memoryState'

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 3)
const looks = confusableLetters.filter((group) => group.reason === 'looks')
const round = (seed: number, difficulty: 'easy' | 'hard' = 'easy') =>
  createMemoryRound({ seed, words, letters, confusables: confusableLetters, difficulty })

describe('a Memory board', () => {
  it('has a picture and its first letter for each pair, all letters different', () => {
    for (const seed of seeds)
      for (const difficulty of ['easy', 'hard'] as const) {
        const board = round(seed, difficulty)
        expect(board.pairs).toHaveLength(pairCounts[difficulty])
        expect(board.cards).toHaveLength(pairCounts[difficulty] * 2)
        expect(new Set(board.cards.map((c) => c.id)).size).toBe(board.cards.length)
        const lettersOnBoard = board.pairs.map((pair) => getWord(pair).firstLetter)
        expect(new Set(lettersOnBoard).size, `${seed}`).toBe(lettersOnBoard.length)
        for (const pair of board.pairs) {
          const cards = board.cards.filter((c) => c.pair === pair)
          expect(cards.map((c) => c.kind).sort()).toEqual(['letter', 'picture'])
          expect(cards.every((c) => c.letter === getWord(pair).firstLetter)).toBe(true)
        }
      }
  })

  it('never puts letters that are easy to mix up on an easy board, and always two look-alikes on a hard one', () => {
    for (const seed of seeds) {
      const easy = round(seed).pairs.map((pair) => getWord(pair).firstLetter)
      for (const a of easy) for (const b of easy) if (a !== b) expect(areConfusable(a, b, confusableLetters), `${seed}: ${a} ${b}`).toBe(false)
      const hard = round(seed, 'hard').pairs.map((pair) => getWord(pair).firstLetter)
      expect(hard.some((a) => hard.some((b) => a !== b && areConfusable(a, b, looks))), `${seed}`).toBe(true)
    }
  })

  it('is the same for the same seed and different for others', () => {
    expect(round(42)).toEqual(round(42))
    expect(new Set(seeds.slice(0, 20).map((seed) => round(seed).cards.map((c) => c.id).join())).size).toBeGreaterThan(10)
  })
})

describe('turning cards', () => {
  const board = round(5)
  const [a, b, c] = board.pairs.map((pair) => board.cards.filter((card) => card.pair === pair))
  const [a1, a2] = a!
  const [b1, b2] = b!
  const [c1] = c!

  it('keeps a pair face up and finishes when every pair is found', () => {
    let state = startMemory(board)
    for (const pair of board.pairs) {
      const [x, y] = board.cards.filter((card) => card.pair === pair)
      expect(turnCard(state, x!.id).result).toBe('turned')
      state = turnCard(state, x!.id).state
      const turn = turnCard(state, y!.id)
      expect(turn.result).toBe('match')
      state = turn.state
    }
    expect(isFinished(state)).toBe(true)
    expect(state.slips).toBe(0)
    expect(turnCard(state, a1!.id).result).toBe('ignored')
  })

  it('turns two cards that do not match back, and counts a slip only when the partner was already seen', () => {
    let state = startMemory(board)
    state = turnCard(state, a1!.id).state
    let turn = turnCard(state, b1!.id)
    expect(turn.result).toBe('mismatch')
    expect(turn.state.slips).toBe(0) // exploring: a2 had never been seen
    state = closeCards(turn.state)
    expect(state.open).toEqual([])

    // b1 was seen, so its partner is known once b2 turns up: missing it now is a slip.
    state = turnCard(state, b2!.id).state
    turn = turnCard(state, c1!.id)
    expect(turn.result).toBe('mismatch')
    expect(turn.state.slips).toBe(1)
    expect(turn.state.slipped).toEqual([b2!.pair])

    // A third card turns the two back at once (taps are never lost), and a known pair still matches.
    state = turnCard(turn.state, a1!.id).state
    expect(state.open).toEqual([a1!.id])
    state = turnCard(state, a2!.id).state
    expect(state.matched).toEqual([a1!.id, a2!.id])
    expect(turnCard(state, a2!.id).result).toBe('ignored')
  })
})
