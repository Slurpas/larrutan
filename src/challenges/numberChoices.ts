import { pickChoices } from './choiceQuestion'
import type { Rng } from './random'

/** The highest number the maths games say and show (src/content/numbers.ts). */
export const highestNumber = 10

/**
 * The answer and other numbers close to it, at most 2 away (3 when there aren't enough, next
 * to 1 or 10), in counting order: the child has to count, not guess big or small.
 */
export function numberChoices(answer: number, count: number, rng: Rng): string[] {
  const within = (reach: number) => Array.from({ length: highestNumber }, (_, i) => i + 1).filter((n) => n !== answer && Math.abs(n - answer) <= reach)
  const near = within(2).length >= count - 1 ? within(2) : within(3)
  return pickChoices(String(answer), near.map(String), count, rng, () => true).sort((a, b) => Number(a) - Number(b))
}
