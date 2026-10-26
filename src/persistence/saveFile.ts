import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { challengeNames } from '../challenges/challengeIds'
import { levelCount, levelKey, levelRule, type Level, type StationState } from '../challenges/levels'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { spelledLengths, spellingWords } from '../challenges/spelling/createRound'
import { highestBox, lowestBox, practiceKey, type Mastery } from '../learning/mastery'
import { findItem, items } from '../rewards/items'
import { initialProgress, type Progress } from '../rewards/progress'

/**
 * The saved form of one profile's progress (PRD §12). Bump the version whenever the
 * shape changes, and add an upgrade step from the old version, with a test, in `readSave`.
 * 1: Task 7. 2: mastery per letter and word (Task 11). 3: an outfit, one item per slot (Task 10).
 * 4: the level each station opens at (Task 15). 5: how many items the child has seen (Task 19).
 * 6: four levels per station, with the scores of the last rounds (Task 23).
 */
export const saveVersion = 6

export interface SaveFile {
  version: number
  savedAt: string
  /** Everything except the round ledger, which only stops a double event within one session. */
  progress: Omit<Progress, 'rounds'>
}

export type ReadResult =
  /** Nothing saved yet. */
  | { kind: 'empty' }
  /** `repaired`: something in the save was broken and has been reset; the rest was kept. */
  | { kind: 'loaded'; progress: Progress; repaired: boolean }
  /** Saved by a newer version of the game: play with what can be read, but never save over it. */
  | { kind: 'newer'; progress: Progress }

export function toSaveFile(progress: Progress, now: Date): SaveFile {
  const { xp, roundsCompleted, completedLevels, stations, unlockedItems, itemsSeen, worn, mastery } = progress
  return {
    version: saveVersion,
    savedAt: now.toISOString(),
    progress: { xp, roundsCompleted, completedLevels, stations, unlockedItems, itemsSeen, worn, mastery },
  }
}

/** Reads whatever is stored, however old or broken; it never throws. */
export function readSave(stored: unknown): ReadResult {
  if (stored === undefined || stored === null) return { kind: 'empty' }
  if (!isRecord(stored) || !isCount(stored.version) || stored.version < 1) {
    return { kind: 'loaded', progress: initialProgress, repaired: true }
  }
  let upgraded = stored.progress
  if (stored.version <= 1) upgraded = upgradeFrom1(upgraded)
  if (stored.version <= 2) upgraded = upgradeFrom2(upgraded)
  if (stored.version <= 3) upgraded = upgradeFrom3(upgraded)
  if (stored.version <= 4) upgraded = upgradeFrom4(upgraded)
  if (stored.version <= 5) upgraded = upgradeFrom5(upgraded)
  const { progress, repaired } = repair(upgraded)
  if (stored.version > saveVersion) return { kind: 'newer', progress }
  return { kind: 'loaded', progress, repaired }
}

const challengeIds = Object.keys(challengeNames) as ChallengeId[]
const allLevels = Array.from({ length: levelCount }, (_, i) => (i + 1) as Level)
const knownLevels = new Set(challengeIds.flatMap((challenge) => allLevels.map((level) => levelKey(challenge, level))))
const knownItems = new Set(items.map((item) => item.id))
const letterIds = letters.map((letter) => letter.id)
const wordIds = words.map((word) => word.id)
const knownPractice = new Set([
  ...letterIds.map((id) => practiceKey('findLetter', id)),
  ...wordIds.map((id) => practiceKey('firstLetter', id)),
  ...wordIds.map((id) => practiceKey('wordPicture', id)),
  ...spellingWords(words, spelledLengths).map((word) => practiceKey('spelling', word.id)),
  ...wordIds.map((id) => practiceKey('memory', id)),
  ...wordIds.map((id) => practiceKey('sorting', id)),
])

/** Version 1 had no mastery: everything starts unpractised. */
function upgradeFrom1(progress: unknown): unknown {
  return isRecord(progress) ? { ...progress, mastery: {} } : progress
}

/** Version 2 had one worn item (always a hat then); it moves into its slot. */
function upgradeFrom2(progress: unknown): unknown {
  if (!isRecord(progress)) return progress
  const { wornItem, ...rest } = progress
  const item = typeof wornItem === 'string' ? findItem(wornItem) : undefined
  return { ...rest, worn: item ? { [item.slot]: item.id } : {} }
}

/**
 * Version 3 had no station levels: a station opened at the first level not completed, so
 * a station whose easy level was done opened hard. Keep that, so nothing changes for the child.
 */
function upgradeFrom3(progress: unknown): unknown {
  if (!isRecord(progress)) return progress
  const done = Array.isArray(progress.completedLevels) ? progress.completedLevels : []
  // The stations that had a hard level then, in that version's names ("findLetter:easy").
  const levels = Object.fromEntries(
    ['findLetter', 'firstLetter'].filter((challenge) => done.includes(`${challenge}:easy`)).map((challenge) => [challenge, 'hard']),
  )
  return { ...progress, levels }
}

/**
 * Version 4 didn't know what the child had seen. Everything counts as new, so the map's
 * button points the child to "Mina saker" once (children had trouble finding it, 2026-10-24).
 */
function upgradeFrom4(progress: unknown): unknown {
  return isRecord(progress) ? { ...progress, itemsSeen: 0 } : progress
}

/**
 * Version 5 had two levels per station, easy and hard: they become levels 1 and 2, with no
 * scores yet and nothing to announce. Levels 3 and 4 are reached by playing.
 */
function upgradeFrom5(progress: unknown): unknown {
  if (!isRecord(progress)) return progress
  const { levels, ...rest } = progress
  const asLevel = (difficulty: unknown) => (difficulty === 'hard' ? 2 : 1)
  const stations = isRecord(levels)
    ? Object.fromEntries(Object.entries(levels).map(([challenge, difficulty]) => [challenge, { level: asLevel(difficulty), recent: [], played: asLevel(difficulty) }]))
    : {}
  const completedLevels = Array.isArray(rest.completedLevels)
    ? rest.completedLevels.map((key: unknown) => (typeof key === 'string' ? key.replace(/:easy$/, ':1').replace(/:hard$/, ':2') : key))
    : rest.completedLevels
  return { ...rest, stations, completedLevels }
}

/** Keeps every field that makes sense and resets the rest, so one bad value never loses everything. */
function repair(saved: unknown): { progress: Progress; repaired: boolean } {
  if (!isRecord(saved)) return { progress: initialProgress, repaired: true }
  let repaired = false
  const count = (value: unknown) => {
    if (isCount(value)) return value
    repaired = true
    return 0
  }
  const known = (value: unknown, allowed: Set<string>) => {
    if (!Array.isArray(value)) {
      repaired = true
      return []
    }
    const kept = [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && allowed.has(entry)))]
    if (kept.length !== value.length) repaired = true
    return kept
  }

  const masteryFrom = (value: unknown): Mastery => {
    if (!isRecord(value)) {
      repaired = true
      return {}
    }
    const kept = Object.entries(value).filter(
      ([key, box]) => knownPractice.has(key) && Number.isInteger(box) && (box as number) >= lowestBox && (box as number) <= highestBox,
    )
    if (kept.length !== Object.keys(value).length) repaired = true
    return Object.fromEntries(kept) as Mastery
  }

  /** Only stations the game has, at a real level, with scores between 0 and 1. */
  const stationsFrom = (value: unknown): Progress['stations'] => {
    if (!isRecord(value)) {
      repaired = true
      return {}
    }
    const isLevel = (level: unknown): level is Level => Number.isInteger(level) && (level as number) >= 1 && (level as number) <= levelCount
    const kept = Object.entries(value).flatMap(([challenge, station]): [string, StationState][] => {
      if (!(challenge in challengeNames) || !isRecord(station) || !isLevel(station.level)) return []
      const saved = Array.isArray(station.recent) ? station.recent : []
      const recent = saved.filter((score): score is number => typeof score === 'number' && score >= 0 && score <= 1).slice(-levelRule.remember)
      if (recent.length !== saved.length || !Array.isArray(station.recent)) repaired = true
      if (station.played !== undefined && !isLevel(station.played)) repaired = true
      return [[challenge, isLevel(station.played) ? { level: station.level, recent, played: station.played } : { level: station.level, recent }]]
    })
    if (kept.length !== Object.keys(value).length) repaired = true
    return Object.fromEntries(kept)
  }

  const unlockedItems = known(saved.unlockedItems, knownItems)
  /** Only unlocked items, each in its own slot. */
  const outfitFrom = (value: unknown): Outfit => {
    if (!isRecord(value)) {
      repaired = true
      return {}
    }
    const kept = Object.entries(value).filter(([slot, id]) => {
      const item = typeof id === 'string' ? findItem(id) : undefined
      return item !== undefined && item.slot === slot && unlockedItems.includes(item.id)
    })
    if (kept.length !== Object.keys(value).length) repaired = true
    return Object.fromEntries(kept) as Outfit
  }

  return {
    progress: {
      xp: count(saved.xp),
      roundsCompleted: count(saved.roundsCompleted),
      completedLevels: known(saved.completedLevels, knownLevels),
      stations: stationsFrom(saved.stations),
      unlockedItems,
      itemsSeen: Math.min(count(saved.itemsSeen), unlockedItems.length),
      worn: outfitFrom(saved.worn),
      mastery: masteryFrom(saved.mastery),
      rounds: {},
    },
    repaired,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0
}
