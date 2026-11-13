import { practiceOrder } from '../../learning/mastery'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import { numberChoices } from '../numberChoices'
import { createRng, shuffle } from '../random'

/**
 * Äppelträdet, the first game in the town of maths (docs/MATHS_PLAN.md, step 1): counting
 * things. The child picks apples from a tree into a basket, one number for each apple, and
 * then says how many there are; later counts apples already in the basket, and at last picks
 * as many as asked for ("Plocka sex äpplen!").
 *   pick    every apple on the tree is picked, counted aloud, then "Hur många?"
 *   basket  the apples already lie in the basket, in rows of five: "Hur många?"
 *   make    more apples than asked for; the child picks, and taps the tick when it is enough
 */
export type AppleMode = 'pick' | 'basket' | 'make'

export interface AppleQuestion extends ChoiceQuestion {
  /** How many apples to count, or to pick ('make'): the answer. */
  count: number
  /** The tree's apples at the start (spots in src/art/appleTree.ts, `treeSpots`): all picked ('pick'), or more than asked for ('make'). None in 'basket'. */
  spots: number[]
}

export interface AppleRound extends ChoiceRound<AppleQuestion> {
  mode: AppleMode
}

/** How many apples the tree has room for, and the basket (two rows of five). */
export const appleRoom = 10

/** A count as a mastery item: "7". Every level practises the same numbers. */
export const countKey = (count: number) => String(count)

/** Every count a round can ask about (the save file knows these). */
export const appleCounts = Array.from({ length: appleRoom }, (_, i) => i + 1)

export interface AppleOptions {
  seed: number
  mode: AppleMode
  /** The fewest and the most apples to count. */
  min: number
  max: number
  /** Number cards to choose from; none in 'make'. */
  choices: number
  questions: number
  /** Mastery box per count ("7"): numbers still being learned come up more often (src/learning). */
  practiceBox?: (count: string) => number
}

/** Counts in practice order (each once in a round), and where on the tree their apples hang. */
export function createAppleRound({ seed, mode, min, max, choices, questions, practiceBox = () => 1 }: AppleOptions): AppleRound {
  const rng = createRng(seed)
  const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const picked = practiceOrder(counts, (count) => practiceBox(countKey(count)), rng).slice(0, questions)
  return {
    seed,
    mode,
    questions: picked.map((count) => {
      // 'make' hangs two or three apples more than asked for, so the child has to stop in time.
      const onTree = mode === 'basket' ? 0 : mode === 'make' ? Math.min(appleRoom, count + 2 + Math.floor(rng() * 2)) : count
      const spots = shuffle(
        Array.from({ length: appleRoom }, (_, i) => i),
        rng,
      )
        .slice(0, onTree)
        .sort((a, b) => a - b)
      return { target: String(count), choices: mode === 'make' ? [] : numberChoices(count, choices, rng), count, spots }
    }),
  }
}
