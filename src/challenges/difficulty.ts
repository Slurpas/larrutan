/**
 * How the letters of a question are picked (PRD §5, §6): 'easy' never offers letters that
 * look or sound alike; 'hard' offers the answer's look-alikes on purpose. Which one a round
 * uses, and how many choices, comes from the station's level (src/challenges/levels.ts).
 */
export type Difficulty = 'easy' | 'hard'

/** How many choices a question offers when nothing else is said. */
export const choiceCounts: Record<Difficulty, number> = { easy: 3, hard: 4 }

/** The look-alike rule of a level that does or doesn't use look-alikes. */
export function lookAlikeRule(lookAlikes: boolean): Difficulty {
  return lookAlikes ? 'hard' : 'easy'
}
