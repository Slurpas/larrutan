import type { Difficulty } from '../challenges/difficulty'

/**
 * All reward numbers in one place (PRD §10), tuned after playtests.
 * Rewards come from completed rounds only: never from taps, answers or retries,
 * and hints or wrong answers along the way never reduce them.
 */
export const rewardRules = {
  /** XP for finishing a challenge level for the first time. */
  firstCompletionXp: { easy: 20, hard: 30 } satisfies Record<Difficulty, number>,
  /** Replaying a level already completed is still worth something, but much less. */
  replayShare: 0.25,
  /** XP needed to go from level n to n + 1 is `levelStepXp + levelStepGrowth * n`. */
  levelStepXp: 20,
  levelStepGrowth: 10,
} as const

export function roundXp(difficulty: Difficulty, firstCompletion: boolean): number {
  const full = rewardRules.firstCompletionXp[difficulty]
  return firstCompletion ? full : Math.round(full * rewardRules.replayShare)
}

/** Total XP needed to reach a player level (level 1 needs none): 0, 30, 70, 120, 180, … */
export function xpForLevel(level: number): number {
  let total = 0
  for (let n = 1; n < level; n++) total += rewardRules.levelStepXp + rewardRules.levelStepGrowth * n
  return total
}

export function levelForXp(xp: number): number {
  let level = 1
  while (xp >= xpForLevel(level + 1)) level++
  return level
}

/** How far into the current level, from 0 to 1, for the XP bar. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp)
  const start = xpForLevel(level)
  return (xp - start) / (xpForLevel(level + 1) - start)
}
