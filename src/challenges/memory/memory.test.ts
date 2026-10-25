import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { alsoCalledLetters } from '../../content/validation'
import { getWord, words } from '../../content/words'
import { lookAlikeRule } from '../difficulty'
import { levelParams, levelRule, type Level } from '../levels'
import { createRng, type Rng } from '../random'
import { createMemoryRound, type MemoryCard, type MemoryRound } from './createRound'
import { closeCards, isFinished, memoryScore, startMemory, turnCard, type MemoryState } from './memoryState'

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 3)
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const looks = confusableLetters.filter((group) => group.reason === 'looks')
const round = (seed: number, level: Level = 1) => {
  const { pairs, lookAlikes } = levelParams('memory', level)
  return createMemoryRound({ seed, words, letters, confusables: confusableLetters, difficulty: lookAlikeRule(lookAlikes), pairs })
}

describe('a Memory board', () => {
  it('has a picture and its first letter for each pair, all letters different, at every level', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const board = round(seed, level)
        const { pairs } = levelParams('memory', level)
        expect(board.pairs).toHaveLength(pairs)
        expect(board.cards).toHaveLength(pairs * 2)
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

  it('has no letters that are easy to mix up until the look-alike levels, and then always two that look alike', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const onBoard = round(seed, level).pairs.map((pair) => getWord(pair).firstLetter)
        if (levelParams('memory', level).lookAlikes) {
          expect(onBoard.some((a) => onBoard.some((b) => a !== b && areConfusable(a, b, looks))), `${seed} ${level}`).toBe(true)
        } else {
          for (const a of onBoard) for (const b of onBoard) if (a !== b) expect(areConfusable(a, b, confusableLetters), `${seed}: ${a} ${b}`).toBe(false)
        }
      }
  })

  it("never puts a picture with the letter of another name for it (the train, \"lok\", and an L)", () => {
    for (const seed of seeds)
      for (const level of levels) {
        const pairs = round(seed, level).pairs.map(getWord)
        for (const word of pairs)
          for (const other of pairs) expect(alsoCalledLetters(word, letters).has(other.firstLetter), `${seed}: ${word.base} ${other.base}`).toBe(false)
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

/**
 * Plays a whole board like a child who remembers where a card they have seen is with
 * probability `recall`, and otherwise turns cards they haven't seen yet; or, with
 * `recall` null, like a child tapping at random. Returns the score and the turns taken.
 */
function playBoard(board: MemoryRound, recall: number | null, rng: Rng): { score: number; turns: number } {
  let state: MemoryState = startMemory(board)
  let turns = 0
  const pick = (cards: readonly MemoryCard[]) => cards[Math.floor(rng() * cards.length)]!
  const remembers = () => recall !== null && rng() < recall
  while (!isFinished(state)) {
    state = closeCards(state)
    const faceDown = board.cards.filter((card) => !state.matched.includes(card.id))
    const unseen = faceDown.filter((card) => !state.seen.includes(card.id))
    const partnerOf = (card: MemoryCard) => faceDown.find((other) => other.pair === card.pair && other.id !== card.id)!
    // Both cards of a pair seen: go for it, if the child remembers.
    const knownPair = faceDown.find((card) => state.seen.includes(card.id) && state.seen.includes(partnerOf(card).id))
    let first: MemoryCard
    let second: MemoryCard
    if (recall === null) {
      first = pick(faceDown)
      second = pick(faceDown.filter((card) => card !== first))
    } else if (knownPair && remembers()) {
      first = knownPair
      second = partnerOf(knownPair)
    } else {
      first = pick(unseen.length > 0 ? unseen : faceDown)
      const partner = partnerOf(first)
      const others = faceDown.filter((card) => card !== first)
      const unseenOthers = others.filter((card) => !state.seen.includes(card.id))
      if (state.seen.includes(partner.id)) second = remembers() ? partner : pick(others)
      else second = pick(unseenOthers.length > 0 ? unseenOthers : others)
    }
    state = turnCard(state, first.id).state
    state = turnCard(state, second.id).state
    turns++
  }
  return { score: memoryScore(state), turns }
}

const average = (values: readonly number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

describe('how well the child remembered', () => {
  it('ignores exploring: a board found without ever needing to remember is flawless', () => {
    const board = round(5)
    let state = startMemory(board)
    for (const pair of board.pairs) {
      const [x, y] = board.cards.filter((card) => card.pair === pair)
      state = turnCard(turnCard(state, x!.id).state, y!.id).state
    }
    expect(memoryScore(state)).toBe(1)
  })

  it('scores 0 when every partner the child had seen was missed', () => {
    const board = round(5)
    const [[a1, a2], [b1]] = board.pairs.map((pair) => board.cards.filter((card) => card.pair === pair))
    let state = turnCard(turnCard(startMemory(board), a1!.id).state, b1!.id).state
    // a2 now: its partner a1 has been seen, but the child turns b1 again.
    state = turnCard(turnCard(closeCards(state), a2!.id).state, b1!.id).state
    expect(state.known).toBe(1)
    expect(memoryScore(state)).toBe(0)
  })

  it('tells a child who remembers from one tapping at random, at every level', () => {
    for (const level of levels) {
      const play = (recall: number | null) => seeds.map((seed) => playBoard(round(seed, level), recall, createRng(seed)))
      const scores = (recall: number | null) => average(play(recall).map((game) => game.score))
      expect(scores(1), `perfect memory, level ${level}`).toBe(1)
      // A child who remembers three times in four: well clear of going down, about at going up.
      expect(scores(0.75), `level ${level}`).toBeGreaterThan(0.6)
      expect(scores(0.75), `level ${level}`).toBeLessThan(0.95)
      // Tapping at random: about as good as guessing, so a child who does that plays smaller boards
      // again. Six cards leave too few turns to tell luck from memory for sure (about 0.35 there).
      expect(scores(null), `random, level ${level}`).toBeLessThan(level === 1 ? 0.5 : levelRule.lowerAt)
      // And the turns: never fewer than the pairs, many more when tapping at random.
      const { pairs } = levelParams('memory', level)
      expect(Math.min(...play(1).map((game) => game.turns))).toBeGreaterThanOrEqual(pairs)
      expect(average(play(null).map((game) => game.turns))).toBeGreaterThan(1.5 * average(play(1).map((game) => game.turns)))
    }
  })
})
