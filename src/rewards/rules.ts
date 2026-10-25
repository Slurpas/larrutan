import type { Level } from '../challenges/levels'

/**
 * All reward numbers in one place (PRD §10), tuned after playtests.
 * Rewards come from completed rounds only: never from taps, answers or retries,
 * and hints or wrong answers along the way never reduce them.
 */
export const rewardRules = {
  /**
   * XP for a round at each station level: the first time that level is completed, and every
   * round after. Levels 3 and 4 (2026-10-25) have no first-time bonus: the item pacing was
   * tuned on two levels, and the extra XP would have brought the crown about 20 rounds
   * sooner for a child who climbs. Reaching a level is celebrated on the end screen instead.
   */
  levelXp: {
    1: { first: 20, replay: 5 },
    2: { first: 30, replay: 8 },
    3: { first: 8, replay: 8 },
    4: { first: 8, replay: 8 },
  } satisfies Record<Level, { first: number; replay: number }>,
  /**
   * Which rounds may give an item (never more than one): every round for a new player
   * (1–6), then every other round (8, 10, … 32), then every third (34, 37, …): more at first,
   * then a bit harder (user feedback 2026-10-25). Rounds 7 and 33 keep a gap where the pace changes.
   */
  itemRhythm: [
    { from: 1, to: 6, every: 1 },
    { from: 8, to: 32, every: 2 },
    { from: 34, to: Infinity, every: 3 },
  ],
  /** XP needed to go from level n to n + 1 is `levelStepXp + levelStepGrowth * n`. */
  levelStepXp: 20,
  levelStepGrowth: 10,
} as const

export function roundXp(level: Level, firstCompletion: boolean): number {
  const xp = rewardRules.levelXp[level]
  return firstCompletion ? xp.first : xp.replay
}

/** May the round with this number (the first is 1) give an item? */
export function isItemRound(round: number): boolean {
  return rewardRules.itemRhythm.some(({ from, to, every }) => round >= from && round <= to && (round - from) % every === 0)
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
