import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { challengeDifficulties, levelKey, type Difficulty, type StationLevels } from '../challenges/difficulty'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { spellingWords } from '../challenges/spelling/createRound'
import { highestBox, lowestBox, practiceKey, type Mastery } from '../learning/mastery'
import { findItem, items } from '../rewards/items'
import { initialProgress, type Progress } from '../rewards/progress'

/**
 * The saved form of one profile's progress (PRD §12). Bump the version whenever the
 * shape changes, and add an upgrade step from the old version, with a test, in `readSave`.
 * 1: Task 7. 2: mastery per letter and word (Task 11). 3: an outfit, one item per slot (Task 10).
 * 4: the level each station opens at (Task 15).
 */
export const saveVersion = 4

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
  const { xp, roundsCompleted, completedLevels, levels, unlockedItems, worn, mastery } = progress
  return {
    version: saveVersion,
    savedAt: now.toISOString(),
    progress: { xp, roundsCompleted, completedLevels, levels, unlockedItems, worn, mastery },
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
  const { progress, repaired } = repair(upgraded)
  if (stored.version > saveVersion) return { kind: 'newer', progress }
  return { kind: 'loaded', progress, repaired }
}

const knownLevels = new Set(
  (Object.keys(challengeDifficulties) as ChallengeId[]).flatMap((challenge) =>
    challengeDifficulties[challenge].map((difficulty) => levelKey(challenge, difficulty)),
  ),
)
const knownItems = new Set(items.map((item) => item.id))
const letterIds = letters.map((letter) => letter.id)
const wordIds = words.map((word) => word.id)
const knownPractice = new Set([
  ...letterIds.map((id) => practiceKey('findLetter', id)),
  ...wordIds.map((id) => practiceKey('firstLetter', id)),
  ...wordIds.map((id) => practiceKey('wordPicture', id)),
  ...spellingWords(words).map((word) => practiceKey('spelling', word.id)),
  ...wordIds.map((id) => practiceKey('memory', id)),
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
  const levels = Object.fromEntries(
    (Object.keys(challengeDifficulties) as ChallengeId[])
      .filter((challenge) => challengeDifficulties[challenge].includes('hard') && done.includes(levelKey(challenge, 'easy')))
      .map((challenge) => [challenge, 'hard']),
  )
  return { ...progress, levels }
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

  /** Only levels a station really has. */
  const levelsFrom = (value: unknown): StationLevels => {
    if (!isRecord(value)) {
      repaired = true
      return {}
    }
    const kept = Object.entries(value).filter(
      ([challenge, level]) =>
        challenge in challengeDifficulties && challengeDifficulties[challenge as ChallengeId].includes(level as Difficulty),
    )
    if (kept.length !== Object.keys(value).length) repaired = true
    return Object.fromEntries(kept) as StationLevels
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
      levels: levelsFrom(saved.levels),
      unlockedItems,
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
