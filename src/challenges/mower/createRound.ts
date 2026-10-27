import { practiceOrder } from '../../learning/mastery'
import type { ChoiceQuestion, ChoiceRound } from '../choiceQuestion'
import { numberChoices } from '../numberChoices'
import { createRng, shuffle } from '../random'

/**
 * Gräsklipparen (the user's idea, 2026-10-27): the child mows a lawn, and sums hide under the
 * tall grass, unmarked: mowing over one stops the mower until it is answered. The round ends
 * when the whole lawn is mowed. Flowers grow here and there, as decoration only (the user's
 * feedback the same day: flowers on the sums gave them away).
 */
export interface MowerQuestion extends ChoiceQuestion {
  /** The sum's two numbers; the target is its answer. */
  parts: [number, number]
  sign: '+' | '-'
}

export interface Cell {
  col: number
  row: number
}

export interface MowerRound extends ChoiceRound<MowerQuestion> {
  cols: number
  rows: number
  /** Where the mower starts: the middle of the left edge. */
  start: Cell
  /** Where the sums hide. Whichever is found first asks the first question, and so on. */
  spots: Cell[]
  /** Where flowers grow in the tall grass, wherever they happen to: they say nothing about the sums. */
  flowers: Cell[]
}

/** The lawn, in cells (src/art/garden.ts); a fifth row at the user's wish (2026-10-27). */
export const lawn = { cols: 8, rows: 5 } as const

/** How many cells have flowers in their grass. */
const flowerCells = 7

/** A sum as a mastery item: "2+3", "7-2". */
export const sumKey = ({ parts: [a, b], sign }: Pick<MowerQuestion, 'parts' | 'sign'>) => `${a}${sign}${b}`

export const answerOf = ({ parts: [a, b], sign }: Pick<MowerQuestion, 'parts' | 'sign'>) => (sign === '+' ? a + b : a - b)

/** Every sum up to `maxResult`: plus with two parts of at least 1, and with `minus` also minus sums whose answer is at least 1. */
export function mowerSums(maxResult: number, minus: boolean): Pick<MowerQuestion, 'parts' | 'sign'>[] {
  const sums: Pick<MowerQuestion, 'parts' | 'sign'>[] = []
  for (let a = 1; a <= maxResult; a++)
    for (let b = 1; b <= maxResult; b++) {
      if (a + b <= maxResult) sums.push({ parts: [a, b], sign: '+' })
      if (minus && a - b >= 1) sums.push({ parts: [a, b], sign: '-' })
    }
  return sums
}

export interface MowerOptions {
  seed: number
  maxResult?: number
  minus?: boolean
  sums?: number
  choices?: number
  /** Mastery box per sum ("2+3"): sums still being learned come up more often (src/learning). */
  practiceBox?: (sum: string) => number
}

/**
 * Sums in practice order, never the same answer twice in a row, each among close numbers
 * (`numberChoices`). Their spots are spread over the lawn, at least one cell apart and never
 * next to the start, so there is always some mowing to do.
 */
export function createMowerRound({ seed, maxResult = 5, minus = false, sums = 3, choices = 3, practiceBox = () => 1 }: MowerOptions): MowerRound {
  const rng = createRng(seed)
  const picked: Pick<MowerQuestion, 'parts' | 'sign'>[] = []
  for (const sum of practiceOrder(mowerSums(maxResult, minus), (s) => practiceBox(sumKey(s)), rng)) {
    if (picked.length === sums) break
    if (picked.length > 0 && answerOf(picked.at(-1)!) === answerOf(sum)) continue
    picked.push(sum)
  }

  const start = { col: 0, row: Math.floor(lawn.rows / 2) }
  const apart = (a: Cell, b: Cell, cells: number) => Math.max(Math.abs(a.col - b.col), Math.abs(a.row - b.row)) > cells
  const cells = Array.from({ length: lawn.cols * lawn.rows }, (_, i) => ({ col: i % lawn.cols, row: Math.floor(i / lawn.cols) }))
  const spots: Cell[] = []
  for (const cell of shuffle(cells, rng)) {
    if (spots.length === picked.length) break
    if (apart(cell, start, 1) && spots.every((spot) => apart(cell, spot, 1))) spots.push(cell)
  }

  // Flowers anywhere but the start, chosen on their own: some may grow over a sum, most don't.
  const flowers = shuffle(cells, rng)
    .filter((cell) => apart(cell, start, 0))
    .slice(0, flowerCells)

  return {
    seed,
    ...lawn,
    start,
    spots,
    flowers,
    questions: picked.map((sum) => ({ ...sum, target: String(answerOf(sum)), choices: numberChoices(answerOf(sum), choices, rng) })),
  }
}
