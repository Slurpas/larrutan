import { describe, expect, it } from 'vitest'
import { numberWords } from '../../content/numbers'
import { findChoiceProblems } from '../choiceQuestion'
import { levelParams, type Level } from '../levels'
import { createFruitRound, factKey, fruitFacts, fruitKinds } from './createRound'

const seeds = Array.from({ length: 150 }, (_, i) => i * 7919 + 3)
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const numbers = new Set(numberWords.map((n) => String(n.value)))
const roundAt = (seed: number, level: Level) => {
  const { maxSum, choices } = levelParams('fruit', level)
  return createFruitRound({ seed, maxSum, choices })
}

describe('Räkna frukterna', () => {
  it('knows every sum of two parts of at least one, up to the largest total', () => {
    expect(fruitFacts(9)).toHaveLength(36)
    expect(fruitFacts(10)).toHaveLength(45)
    for (const [a, b] of fruitFacts(10)) expect(a >= 1 && b >= 1 && a + b <= 10).toBe(true)
    expect(new Set(fruitFacts(10).map(factKey)).size).toBe(45)
  })

  it('asks five sums with two kinds of fruit, the answer among close numbers in counting order', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const { maxSum, choices } = levelParams('fruit', level)
        const round = roundAt(seed, level)
        expect(round.questions).toHaveLength(5)
        expect(new Set(round.questions.map((q) => factKey(q.parts))).size, `${seed} ${level}`).toBe(5)
        round.questions.forEach((q, i) => {
          const [a, b] = q.parts
          expect(a >= 1 && b >= 1 && a + b <= maxSum, `${seed} ${level} ${factKey(q.parts)}`).toBe(true)
          expect(q.target).toBe(String(a + b))
          expect(findChoiceProblems(q, choices, numbers), `${seed} ${level}`).toEqual([])
          expect(q.choices.map(Number)).toEqual([...q.choices.map(Number)].sort((x, y) => x - y))
          for (const choice of q.choices) expect(Math.abs(Number(choice) - (a + b))).toBeLessThanOrEqual(a + b >= 9 ? 3 : 2)
          expect(q.fruits[0]).not.toBe(q.fruits[1])
          for (const fruit of q.fruits) expect(fruitKinds).toContain(fruit)
          if (i > 0) expect(q.target, `${seed} ${level}: the same total twice in a row`).not.toBe(round.questions[i - 1]!.target)
        })
      }
  })

  it('is the same for the same seed, and favours sums still being learned', () => {
    expect(roundAt(42, 3)).toEqual(roundAt(42, 3))
    // Every sum but "2+3" is known well: it comes up far more often than one sum in 36 would.
    const asked = seeds.filter((seed) => createFruitRound({ seed, practiceBox: (fact) => (fact === '2+3' ? 1 : 5) }).questions.some((q) => factKey(q.parts) === '2+3'))
    expect(asked.length / seeds.length).toBeGreaterThan(0.5)
  })
})
