import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { levelAfterRound, levelKey, nextDifficulty, type Difficulty, type StationLevels } from '../challenges/difficulty'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { spellingWords } from '../challenges/spelling/createRound'
import { boxOf, practiceKey, recordPractice, type Mastery, type Practiced } from '../learning/mastery'
import { findItem, items, type UnlockCondition } from './items'
import { levelForXp, roundXp } from './rules'

export interface Progress {
  xp: number
  roundsCompleted: number
  /** Challenge levels finished at least once, e.g. "findLetter:hard". */
  completedLevels: string[]
  /** The level each station opens at next (src/challenges/difficulty.ts). */
  levels: StationLevels
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
  /** The station opens at a different level next time: 'up' is announced, 'down' happens quietly. */
  levelChange: 'up' | 'down' | null
}

export const initialProgress: Progress = {
  xp: 0,
  roundsCompleted: 0,
  completedLevels: [],
  levels: {},
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

  const levelBefore = nextDifficulty(completion.challenge, progress.levels)
  const levelNext = levelAfterRound(completion.challenge, completion.difficulty, completion.wrongTaps)
  const next: Progress = {
    ...progress,
    xp: progress.xp + xpGained,
    roundsCompleted: progress.roundsCompleted + 1,
    completedLevels: firstCompletion ? [...progress.completedLevels, key] : progress.completedLevels,
    levels: { ...progress.levels, [completion.challenge]: levelNext },
    mastery: recordPractice(progress.mastery, completion.challenge, completion.practiced),
  }
  // Items are rare treats (user feedback 2026-10-24): at most one, and only every other round
  // (rounds 1, 3, 5, …). It is the first one earned, in catalogue order; anything else earned
  // waits for a later round.
  const earned =
    next.roundsCompleted % 2 === 1
      ? items.find((item) => !next.unlockedItems.includes(item.id) && isUnlocked(item.unlock, next))
      : undefined
  const newItems = earned ? [earned.id] : []

  const outcome: RoundOutcome = {
    xpGained,
    firstCompletion,
    xpBefore: progress.xp,
    xpAfter: next.xp,
    levelBefore: levelForXp(progress.xp),
    levelAfter: levelForXp(next.xp),
    newItems,
    levelChange: levelNext === levelBefore ? null : levelNext === 'hard' ? 'up' : 'down',
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
  spelling: spellingWords(words).map((word) => word.id),
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
