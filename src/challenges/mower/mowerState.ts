import { firstTryScore } from '../levels'
import type { Cell, MowerQuestion, MowerRound } from './createRound'

/**
 * Where a Gräsklipparen round is: the mower, the mowed cells, the sums found and answered.
 * Pure, so the rules are tested without a screen. The mower drives one cell at a time,
 * across first and then up or down; a cell it reaches is mowed, and a hidden sum there stops
 * it until it is answered.
 */
export interface MowerState {
  round: MowerRound
  mower: Cell
  /** The way the mower last drove sideways: the way it faces. */
  facing: 'right' | 'left'
  /** Mowed cells, as "col,row". */
  mowed: string[]
  /** The spots found so far (indexes into `round.spots`), in the order found: the n-th found asks question n. */
  found: number[]
  /** Wrong numbers tapped for the sum being answered, or null while the mower may drive. */
  asking: { removed: string[] } | null
  /** For each answered sum: right on the first tap? */
  firstTry: boolean[]
}

export const cellKey = ({ col, row }: Cell) => `${col},${row}`

export function startMowing(round: MowerRound): MowerState {
  return { round, mower: round.start, facing: 'right', mowed: [cellKey(round.start)], found: [], asking: null, firstTry: [] }
}

/** One cell nearer `goal`, mowing it; a hidden sum there stops the mower and asks. Stays put while a sum is asked. */
export function driveToward(state: MowerState, goal: Cell): MowerState {
  if (state.asking || isFinished(state)) return state
  const { col, row } = state.mower
  const next = goal.col !== col ? { col: col + Math.sign(goal.col - col), row } : goal.row !== row ? { col, row: row + Math.sign(goal.row - row) } : null
  if (!next || next.col < 0 || next.row < 0 || next.col >= state.round.cols || next.row >= state.round.rows) return state
  const facing = next.col > col ? 'right' : next.col < col ? 'left' : state.facing
  const key = cellKey(next)
  const mowed = state.mowed.includes(key) ? state.mowed : [...state.mowed, key]
  const spot = state.round.spots.findIndex((s) => s.col === next.col && s.row === next.row)
  const found = spot >= 0 && !state.found.includes(spot)
  return { ...state, mower: next, facing, mowed, found: found ? [...state.found, spot] : state.found, asking: found ? { removed: [] } : null }
}

/** The sum being answered: the next question, for the spot just found. */
export function currentSum(state: MowerState): MowerQuestion | undefined {
  return state.asking ? state.round.questions[state.found.length - 1] : undefined
}

/** A tapped number: right ends the question and lets the mower drive on; wrong is greyed out. */
export function answerSum(state: MowerState, choice: string): { state: MowerState; result: 'right' | 'wrong' | 'ignored' } {
  const sum = currentSum(state)
  if (!sum || !state.asking || !sum.choices.includes(choice) || state.asking.removed.includes(choice)) return { state, result: 'ignored' }
  if (choice === sum.target) return { state: { ...state, asking: null, firstTry: [...state.firstTry, state.asking.removed.length === 0] }, result: 'right' }
  return { state: { ...state, asking: { removed: [...state.asking.removed, choice] } }, result: 'wrong' }
}

/** Only the answer is left untapped. */
export function isRevealed(state: MowerState): boolean {
  const sum = currentSum(state)
  return !!sum && sum.choices.every((choice) => choice === sum.target || state.asking!.removed.includes(choice))
}

export function isFinished(state: MowerState): boolean {
  return state.firstTry.length === state.round.spots.length
}

/** Sums right on the first tap, with guessing taken out (as the choice games). */
export function mowerScore(state: MowerState): number {
  return firstTryScore(
    state.firstTry,
    state.round.questions.map((q) => q.choices.length),
  )
}
