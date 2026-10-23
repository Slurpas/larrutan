import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { levelKey, type Difficulty } from '../challenges/difficulty'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { boxOf, practiceKey, recordPractice, type Mastery, type Practiced } from '../learning/mastery'
import { findItem, items, type UnlockCondition } from './items'
import { levelForXp, roundXp } from './rules'

export interface Progress {
  xp: number
  roundsCompleted: number
  /** Challenge levels finished at least once, e.g. "findLetter:hard". */
  completedLevels: string[]
  unlockedItems: string[]
  /** What the character wears: one unlocked item per slot. */
  worn: Outfit
  /** Leitner box per letter and word, per challenge (src/learning). Never shown to the child, never affects rewards. */
  mastery: Mastery
  /** The outcome of every round already counted, by round id. A repeated event returns it again and grants nothing. */
  rounds: Record<string, RoundOutcome>
}

export interface RoundCompletion {
  /** Unique for each round played; the same id is never rewarded twice. */
  roundId: string
  challenge: ChallengeId
  difficulty: Difficulty
  /** Never used to reduce a reward. */
  wrongTaps: number
  /** What each question practised, and whether the first tap was right: updates mastery. */
  practiced: readonly Practiced[]
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
  worn: {},
  mastery: {},
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
    mastery: recordPractice(progress.mastery, completion.challenge, completion.practiced),
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

/** What each challenge practises, for the 'mastered' unlock: its letters, or its words. */
const practisedIn: Record<ChallengeId, readonly string[]> = {
  findLetter: letters.map((letter) => letter.id),
  firstLetter: words.map((word) => word.id),
  wordPicture: words.map((word) => word.id),
}

export function isUnlocked(condition: UnlockCondition, progress: Progress): boolean {
  switch (condition.type) {
    case 'roundsCompleted':
      return progress.roundsCompleted >= condition.count
    case 'playerLevel':
      return levelForXp(progress.xp) >= condition.level
    case 'levelCompleted':
      return progress.completedLevels.includes(levelKey(condition.challenge, condition.difficulty))
    case 'mastered':
      return practisedIn[condition.challenge].every(
        (item) => boxOf(progress.mastery, practiceKey(condition.challenge, item)) >= condition.box,
      )
  }
}

/** Puts on an unlocked item in its slot (replacing what was there), or takes it off if it is already worn. */
export function wear(progress: Progress, itemId: string): Progress {
  const item = findItem(itemId)
  if (!item || !progress.unlockedItems.includes(itemId)) return progress
  const worn = { ...progress.worn }
  if (worn[item.slot] === itemId) delete worn[item.slot]
  else worn[item.slot] = itemId
  return { ...progress, worn }
}
