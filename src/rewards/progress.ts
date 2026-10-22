import type { ChallengeId } from '../challenges/challengeIds'
import { challengeDifficulties, levelKey, type Difficulty } from '../challenges/difficulty'
import { items, type UnlockCondition } from './items'
import { levelForXp, roundXp } from './rules'

export interface Progress {
  xp: number
  roundsCompleted: number
  /** Challenge levels finished at least once, e.g. "findLetter:hard". */
  completedLevels: string[]
  unlockedItems: string[]
  wornItem: string | null
  /** The outcome of every round already counted, by round id. A repeated event returns it again and grants nothing. */
  rounds: Record<string, RoundOutcome>
}

export interface RoundCompletion {
  /** Unique for each round played; the same id is never rewarded twice. */
  roundId: string
  challenge: ChallengeId
  difficulty: Difficulty
  /** Kept for learning progress later (Phase 2). Never used to reduce a reward. */
  wrongTaps: number
}

export interface RoundOutcome {
  xpGained: number
  firstCompletion: boolean
  xpBefore: number
  xpAfter: number
  levelBefore: number
  levelAfter: number
  /** Items unlocked by this round. */
  newItems: string[]
}

export const initialProgress: Progress = {
  xp: 0,
  roundsCompleted: 0,
  completedLevels: [],
  unlockedItems: [],
  wornItem: null,
  rounds: {},
}

/** Rewards a finished round: XP (full the first time, less on replays) and any items it unlocks. */
export function completeRound(
  progress: Progress,
  completion: RoundCompletion,
): { progress: Progress; outcome: RoundOutcome } {
  const already = progress.rounds[completion.roundId]
  if (already) return { progress, outcome: already }

  const key = levelKey(completion.challenge, completion.difficulty)
  const firstCompletion = !progress.completedLevels.includes(key)
  const xpGained = roundXp(completion.difficulty, firstCompletion)

  const next: Progress = {
    ...progress,
    xp: progress.xp + xpGained,
    roundsCompleted: progress.roundsCompleted + 1,
    completedLevels: firstCompletion ? [...progress.completedLevels, key] : progress.completedLevels,
  }
  const newItems = items
    .filter((item) => !next.unlockedItems.includes(item.id) && isUnlocked(item.unlock, next))
    .map((item) => item.id)

  const outcome: RoundOutcome = {
    xpGained,
    firstCompletion,
    xpBefore: progress.xp,
    xpAfter: next.xp,
    levelBefore: levelForXp(progress.xp),
    levelAfter: levelForXp(next.xp),
    newItems,
  }
  return {
    progress: {
      ...next,
      unlockedItems: [...next.unlockedItems, ...newItems],
      rounds: { ...progress.rounds, [completion.roundId]: outcome },
    },
    outcome,
  }
}

export function isUnlocked(condition: UnlockCondition, progress: Progress): boolean {
  switch (condition.type) {
    case 'roundsCompleted':
      return progress.roundsCompleted >= condition.count
    case 'playerLevel':
      return levelForXp(progress.xp) >= condition.level
    case 'levelCompleted':
      return progress.completedLevels.includes(levelKey(condition.challenge, condition.difficulty))
    case 'everyChallengeCompleted':
      return (Object.keys(challengeDifficulties) as ChallengeId[]).every((challenge) =>
        progress.completedLevels.some((key) => key.startsWith(`${challenge}:`)),
      )
  }
}

/** Puts on an unlocked item, or takes it off with null. Locked items can't be worn. */
export function wear(progress: Progress, itemId: string | null): Progress {
  if (itemId !== null && !progress.unlockedItems.includes(itemId)) return progress
  return { ...progress, wornItem: itemId }
}
