import { describe, expect, it } from 'vitest'
import { numberWords } from '../../content/numbers'
import { findChoiceProblems } from '../choiceQuestion'
import { levelParams, type Level } from '../levels'
import { answerOf, createMowerRound, lawn, mowerSums, sumKey } from './createRound'
import { answerSum, cellKey, currentSum, driveToward, isFinished, isRevealed, mowerScore, startMowing } from './mowerState'

const seeds = Array.from({ length: 150 }, (_, i) => i * 7919 + 3)
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const numbers = new Set(numberWords.map((n) => String(n.value)))
const roundAt = (seed: number, level: Level) => {
  const { maxResult, minus, sums, choices } = levelParams('mower', level)
  return createMowerRound({ seed, maxResult, minus, sums, choices })
}

describe('a Gräsklipparen round', () => {
  it('knows plus sums up to the largest answer, and minus sums with an answer of at least one', () => {
    expect(mowerSums(5, false)).toHaveLength(10)
    for (const sum of mowerSums(10, true)) {
      const [a, b] = sum.parts
      expect(a >= 1 && b >= 1 && a <= 10 && answerOf(sum) >= 1 && answerOf(sum) <= 10, sumKey(sum)).toBe(true)
    }
    expect(mowerSums(10, true).some((sum) => sum.sign === '-')).toBe(true)
  })

  it('hides its sums apart on the lawn, never next to the start, each with its answer among close numbers', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const { maxResult, minus, sums, choices } = levelParams('mower', level)
        const round = roundAt(seed, level)
        expect(round.spots, `${seed} ${level}`).toHaveLength(sums)
        expect(round.questions).toHaveLength(sums)
        for (const [i, spot] of round.spots.entries()) {
          expect(spot.col >= 0 && spot.col < lawn.cols && spot.row >= 0 && spot.row < lawn.rows).toBe(true)
          expect(Math.max(Math.abs(spot.col - round.start.col), Math.abs(spot.row - round.start.row))).toBeGreaterThan(1)
          for (const other of round.spots.slice(i + 1)) expect(Math.max(Math.abs(spot.col - other.col), Math.abs(spot.row - other.row))).toBeGreaterThan(1)
        }
        round.questions.forEach((q, i) => {
          expect(answerOf(q) >= 1 && answerOf(q) <= maxResult).toBe(true)
          if (!minus) expect(q.sign).toBe('+')
          expect(q.target).toBe(String(answerOf(q)))
          expect(findChoiceProblems(q, choices, numbers), `${seed} ${level}`).toEqual([])
          if (i > 0) expect(q.target).not.toBe(round.questions[i - 1]!.target)
        })
      }
  })

  it('is the same for the same seed', () => {
    expect(roundAt(42, 4)).toEqual(roundAt(42, 4))
  })
})

describe('mowing', () => {
  const round = roundAt(7, 1)

  it('drives across first, then up or down, mowing every cell on the way, and turns to face the way it drives', () => {
    let state = startMowing(round)
    expect(state.mowed).toEqual([cellKey(round.start)])
    const goal = { col: 3, row: 0 }
    const path: string[] = []
    for (let i = 0; i < 10 && !state.asking; i++) {
      const next = driveToward(state, goal)
      if (next === state) break
      state = next
      path.push(cellKey(state.mower))
    }
    // Unless a sum hid on the way, it got there along the row and then up the column.
    if (!state.asking) {
      expect(state.mower).toEqual(goal)
      expect(path).toEqual(['1,2', '2,2', '3,2', '3,1', '3,0'])
    }
    for (const key of path) expect(state.mowed).toContain(key)
    expect(state.facing).toBe('right')
    // Back towards the start it turns left (unless a sum stopped it).
    if (!state.asking) expect(driveToward(state, round.start).facing).toBe('left')
  })

  it('stops on a hidden sum until it is answered; wrong numbers are greyed out, the right one lets it drive on', () => {
    let state = startMowing(round)
    const spot = round.spots[0]!
    for (let i = 0; i < 20 && !state.asking; i++) state = driveToward(state, spot)
    // It may find another sum on the way first; whichever it finds asks the first question.
    expect(state.asking).not.toBeNull()
    const sum = currentSum(state)!
    expect(sum).toBe(round.questions[0])
    expect(driveToward(state, round.start)).toBe(state)

    const wrong = sum.choices.filter((c) => c !== sum.target)
    let step = answerSum(state, wrong[0]!)
    expect(step.result).toBe('wrong')
    state = step.state
    expect(answerSum(state, wrong[0]!).result).toBe('ignored')
    for (const other of wrong.slice(1)) state = answerSum(state, other).state
    expect(isRevealed(state)).toBe(true)
    step = answerSum(state, sum.target)
    expect(step.result).toBe('right')
    expect(step.state.asking).toBeNull()
    expect(step.state.firstTry).toEqual([false])
  })

  it('is done when every sum is answered, and scores answers right the first time', () => {
    let state = startMowing(round)
    for (const spot of round.spots) {
      for (let i = 0; i < 40 && !isFinished(state); i++) {
        if (state.asking) state = answerSum(state, currentSum(state)!.target).state
        else if (state.mower.col === spot.col && state.mower.row === spot.row) break
        else state = driveToward(state, spot)
      }
    }
    while (state.asking) state = answerSum(state, currentSum(state)!.target).state
    expect(isFinished(state)).toBe(true)
    expect(mowerScore(state)).toBe(1)
    expect(driveToward(state, round.start)).toBe(state)
  })
})
