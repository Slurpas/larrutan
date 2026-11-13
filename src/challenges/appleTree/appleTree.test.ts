import { describe, expect, it } from 'vitest'
import { appleSize, basketLeft, basketSize, basketSlots, tree, treeSpots } from '../../art/appleTree'
import { levelParams, type Level } from '../levels'
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
import { appleRoom, createAppleRound } from './createRound'

const seeds = Array.from({ length: 200 }, (_, i) => i * 7919 + 11)
const roundAt = (level: Level, seed = 4242) => createAppleRound({ seed, ...levelParams('appleTree', level) })
const pickAll = (state: AppleState) => onTree(state).reduce(pickApple, state)

describe('Äppelträdet rounds', () => {
  it('asks about different counts within the level, with the answer among close numbers', () => {
    for (const level of [1, 2, 3, 4] as const) {
      const { min, max, choices, questions, mode } = levelParams('appleTree', level)
      for (const seed of seeds) {
        const round = roundAt(level, seed)
        expect(round.questions).toHaveLength(questions)
        expect(new Set(round.questions.map((q) => q.count)).size).toBe(questions)
        for (const q of round.questions) {
          expect(q.count).toBeGreaterThanOrEqual(min)
          expect(q.count).toBeLessThanOrEqual(max)
          expect(q.target).toBe(String(q.count))
          if (mode === 'make') expect(q.choices).toEqual([])
          else {
            expect(q.choices).toHaveLength(choices)
            expect(q.choices).toContain(q.target)
          }
        }
      }
    }
  })

  it('hangs every apple to count on the tree, more than asked for at the top level, and none when they start in the basket', () => {
    for (const seed of seeds) {
      for (const q of roundAt(1, seed).questions) expect(q.spots).toHaveLength(q.count)
      for (const q of roundAt(3, seed).questions) expect(q.spots).toEqual([])
      for (const q of roundAt(4, seed).questions) {
        expect(q.spots.length).toBeGreaterThanOrEqual(Math.min(appleRoom, q.count + 2))
        expect(q.spots.length).toBeLessThanOrEqual(Math.min(appleRoom, q.count + 3))
        expect(new Set(q.spots).size).toBe(q.spots.length)
        for (const spot of q.spots) expect(spot >= 0 && spot < treeSpots.length).toBe(true)
      }
    }
  })

  it('favours the numbers still being learned', () => {
    const struggling = (count: string) => (count === '4' ? 1 : 5)
    const asked = seeds.filter((seed) => createAppleRound({ seed, ...levelParams('appleTree', 2), practiceBox: struggling }).questions[0]!.count === 4)
    expect(asked.length).toBeGreaterThan(seeds.length / 4)
  })
})

describe('picking apples', () => {
  it('drops each apple into the basket once, and asks how many when the tree is empty', () => {
    let state = startApples(roundAt(1))
    const q = currentQuestion(state)!
    expect(state.phase).toBe('picking')
    const first = q.spots[0]!
    state = pickApple(state, first)
    expect(pickApple(state, first)).toBe(state)
    expect(state.basket).toEqual([first])
    state = pickAll(state)
    expect(state.basket).toHaveLength(q.count)
    expect(onTree(state)).toEqual([])
    expect(state.phase).toBe('asking')
    // Apples can't be put back except at the top level.
    expect(putBack(state, first)).toBe(state)
  })

  it('greys out a wrong number, points at the answer when it is the only one left, and moves on after the right one', () => {
    let state = pickAll(startApples(roundAt(1)))
    const q = currentQuestion(state)!
    const wrong = q.choices.filter((c) => c !== q.target)
    state = chooseNumber(state, wrong[0]!).state
    expect(state.removed).toEqual([wrong[0]])
    expect(chooseNumber(state, wrong[0]!).result).toBe('ignored')
    state = chooseNumber(state, wrong[1]!).state
    expect(isRevealed(state)).toBe(true)
    const { state: right, result } = chooseNumber(state, q.target)
    expect(result).toBe('right')
    expect(right.firstTry).toEqual([false])
    const next = nextQuestion(right)
    expect(next.questionIndex).toBe(1)
    expect(next.basket).toEqual([])
    expect(next.phase).toBe('picking')
  })

  it('numbers apples in the basket as they are touched, and all of them in order when the basket counts itself', () => {
    let state = startApples(roundAt(3))
    const q = currentQuestion(state)!
    expect(state.phase).toBe('asking')
    expect(state.basket).toHaveLength(q.count)
    state = touchApple(state, 2)
    state = touchApple(state, 0)
    expect(touchApple(state, 2)).toBe(state)
    expect(state.counted).toEqual([2, 0])
    expect(countAll(state).counted).toEqual(state.basket)
  })
})

describe('picking as many as asked for', () => {
  it('says too many or too few at the tick, takes apples back, and ignores the tick with an empty basket', () => {
    let state = startApples(roundAt(4))
    const q = currentQuestion(state)!
    expect(finishPicking(state).result).toBe('ignored')
    state = onTree(state)
      .slice(0, q.count + 1)
      .reduce(pickApple, state)
    expect(state.phase).toBe('picking')
    let tick = finishPicking(state)
    expect(tick.result).toBe('tooMany')
    state = putBack(tick.state, state.basket[0]!)
    state = putBack(state, state.basket[0]!)
    expect(state.basket).toHaveLength(q.count - 1)
    tick = finishPicking(state)
    expect(tick.result).toBe('tooFew')
    state = pickApple(tick.state, onTree(tick.state)[0]!)
    tick = finishPicking(state)
    expect(tick.result).toBe('right')
    expect(tick.state.firstTry).toEqual([false])
  })
})

describe('scores', () => {
  const play = (level: Level, rightFirst: (i: number) => boolean) => {
    let state = startApples(roundAt(level))
    while (state.phase !== 'finished') {
      const q = currentQuestion(state)!
      if (state.round.mode === 'make') {
        if (!rightFirst(state.questionIndex)) state = finishPicking(pickApple(state, q.spots[0]!)).state
        state = onTree(state)
          .slice(0, q.count - state.basket.length)
          .reduce(pickApple, state)
        state = finishPicking(state).state
      } else {
        state = pickAll(state)
        if (!rightFirst(state.questionIndex)) state = chooseNumber(state, q.choices.find((c) => c !== q.target)!).state
        state = chooseNumber(state, q.target).state
      }
      state = nextQuestion(state)
    }
    return state
  }

  it('is 1 when every answer is right first time, and counts what was right at the top level', () => {
    for (const level of [1, 2, 3, 4] as const) expect(appleScore(play(level, () => true))).toBe(1)
    expect(appleScore(play(4, (i) => i % 2 === 0))).toBe(0.5)
    expect(appleScore(play(1, () => false))).toBe(0)
  })
})

describe('the apple tree art', () => {
  const overlap = ([ax, ay]: readonly [number, number], [bx, by]: readonly [number, number]) =>
    Math.abs(ax - bx) < appleSize.width && Math.abs(ay - by) < appleSize.height

  it('has room for every apple on the tree and in the basket, none on top of another', () => {
    expect(treeSpots).toHaveLength(appleRoom)
    expect(basketSlots).toHaveLength(appleRoom)
    for (const [i, a] of treeSpots.entries()) for (const b of treeSpots.slice(i + 1)) expect(overlap(a, b), `${a} and ${b}`).toBe(false)
    // In the basket the second row lies a little over the first, but no two apples share a place.
    for (const [i, a] of basketSlots.entries()) for (const b of basketSlots.slice(i + 1)) expect(Math.abs(a[0] - b[0]) >= appleSize.width || Math.abs(a[1] - b[1]) >= 8).toBe(true)
  })

  it('hangs the apples on the leaves, clear of the basket below', () => {
    const basketTop = tree.length - basketSize.height
    for (const [x, y] of treeSpots) {
      expect(tree[y]![x], `${x},${y}`).toMatch(/[qQGl]/)
      if (x + appleSize.width / 2 > basketLeft) expect(y + appleSize.height / 2, `${x},${y}`).toBeLessThan(basketTop)
    }
  })
})
