import { practiceOrder } from '../../learning/mastery'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import { numberChoices } from '../numberChoices'
import { createRng, shuffle } from '../random'

/**
 * Räkna frukterna (the user's idea, 2026-10-27): two kinds of fruit side by side, say 3
 * oranges and 4 pineapples, and the child taps how many there are in all. The sum written
 * under them shows less and less from level to level (src/challenges/levels.ts).
 */
export interface FruitQuestion extends ChoiceQuestion {
  /** How many of each fruit: the two parts of the sum, whose total is the target. */
  parts: [number, number]
  /** Which fruit each part is: word ids, for the pictures. */
  fruits: [string, string]
}

/** The fruit that is counted (word ids, src/art/pictures.ts). */
export const fruitKinds = ['apple', 'orange', 'pineapple'] as const

/** A sum as a mastery item: "3+4". */
export const factKey = ([a, b]: readonly [number, number]) => `${a}+${b}`

/** Every sum of two parts of at least 1 each, up to `maxSum`. */
export function fruitFacts(maxSum: number): [number, number][] {
  const facts: [number, number][] = []
  for (let a = 1; a < maxSum; a++) for (let b = 1; a + b <= maxSum; b++) facts.push([a, b])
  return facts
}

export interface FruitOptions {
  seed: number
  /** The largest total. */
  maxSum?: number
  choices?: number
  questionCount?: number
  /** Mastery box per sum ("3+4"): sums still being learned come up more often (src/learning). */
  practiceBox?: (fact: string) => number
}

/** Sums in practice order, never the same total twice in a row; the answer among close numbers (`numberChoices`). */
export function createFruitRound({ seed, maxSum = 9, choices = 3, questionCount = 5, practiceBox = () => 1 }: FruitOptions): ChoiceRound<FruitQuestion> {
  const rng = createRng(seed)
  const total = ([a, b]: readonly [number, number]) => a + b
  const picked: [number, number][] = []
  for (const fact of practiceOrder(fruitFacts(maxSum), (f) => practiceBox(factKey(f)), rng)) {
    if (picked.length === questionCount) break
    if (picked.length > 0 && total(picked.at(-1)!) === total(fact)) continue
    picked.push(fact)
  }
  return {
    seed,
    questions: picked.map((parts) => {
      const target = total(parts)
      const options = numberChoices(target, choices, rng)
      const fruits = shuffle(fruitKinds, rng).slice(0, 2) as [string, string]
      return { target: String(target), choices: options, parts, fruits }
    }),
  }
}
