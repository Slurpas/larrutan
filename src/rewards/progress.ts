import { factKey, fruitFacts } from '../challenges/fruit/createRound'
import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { levelKey, nextStation, stationLevel, type Level, type StationState } from '../challenges/levels'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { spelledLengths, spellingWords } from '../challenges/spelling/createRound'
import { boxOf, practiceKey, recordPractice, type Mastery, type Practiced } from '../learning/mastery'
import { findItem, items, type UnlockCondition } from './items'
import { isItemRound, levelForXp, roundXp } from './rules'

export interface Progress {
  xp: number
  roundsCompleted: number
  /** Station levels finished at least once, e.g. "findLetter:2". */
  completedLevels: string[]
  /** Each station's level and how the last rounds there went (src/challenges/levels.ts). */
  stations: Partial<Record<ChallengeId, StationState>>
  /** In the order they were earned. */
  unlockedItems: string[]
  /** How many of `unlockedItems` the child has looked at in "Mina saker" or put on; the rest are new. */
  itemsSeen: number
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
  level: Level
  /** How well it went, from 0 (no better than guessing) to 1: moves the station's level, never a reward. */
  score: number
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
  /** The level the station opens at next time. */
  stationLevel: Level
}

export const initialProgress: Progress = {
  xp: 0,
  roundsCompleted: 0,
  completedLevels: [],
  stations: {},
  unlockedItems: [],
  itemsSeen: 0,
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

  const key = levelKey(completion.challenge, completion.level)
  const firstCompletion = !progress.completedLevels.includes(key)
  const xpGained = roundXp(completion.level, firstCompletion)

  const station = nextStation(progress.stations[completion.challenge], completion.score)
  const next: Progress = {
    ...progress,
    xp: progress.xp + xpGained,
    roundsCompleted: progress.roundsCompleted + 1,
    completedLevels: firstCompletion ? [...progress.completedLevels, key] : progress.completedLevels,
    stations: { ...progress.stations, [completion.challenge]: station.state },
    mastery: recordPractice(progress.mastery, completion.challenge, completion.practiced),
  }
  // Items are treats: at most one a round, every round at first, then less often (`itemRhythm`,
  // user feedback 2026-10-24 and 2026-10-25). It is the first one earned, in catalogue order;
  // anything else earned waits for a later round.
  const earned = isItemRound(next.roundsCompleted)
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
    levelChange: station.change,
    stationLevel: stationLevel(station.state),
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
  spelling: spellingWords(words, spelledLengths).map((word) => word.id),
  memory: words.map((word) => word.id),
  sorting: words.map((word) => word.id),
  baskets: words.map((word) => word.id),
  fruit: fruitFacts(10).map(factKey),
}

export function isUnlocked(condition: UnlockCondition, progress: Progress): boolean {
  switch (condition.type) {
    case 'roundsCompleted':
      return progress.roundsCompleted >= condition.count
    case 'playerLevel':
      return levelForXp(progress.xp) >= condition.level
    case 'levelCompleted':
      return progress.completedLevels.includes(levelKey(condition.challenge, condition.level))
    case 'mastered':
      return practisedIn[condition.challenge].every(
        (item) => boxOf(progress.mastery, practiceKey(condition.challenge, item)) >= condition.box,
      )
  }
}

/** Puts on an unlocked item in its slot (replacing what was there), or takes it off if it is already worn. */
/** Items earned since the child last looked in "Mina saker" (or put one on): the map's button shows them. */
export function newItems(progress: Progress): string[] {
  return progress.unlockedItems.slice(progress.itemsSeen)
}

export function seeItems(progress: Progress): Progress {
  return progress.itemsSeen === progress.unlockedItems.length ? progress : { ...progress, itemsSeen: progress.unlockedItems.length }
}

export function wear(progress: Progress, itemId: string): Progress {
  const item = findItem(itemId)
  if (!item || !progress.unlockedItems.includes(itemId)) return progress
  const worn = { ...progress.worn }
  if (worn[item.slot] === itemId) delete worn[item.slot]
  else worn[item.slot] = itemId
  return { ...progress, worn }
}
