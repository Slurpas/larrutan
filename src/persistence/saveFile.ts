import type { ChallengeId } from '../challenges/challengeIds'
import { challengeDifficulties, levelKey } from '../challenges/difficulty'
import { letters } from '../content/letters'
import { words } from '../content/words'
import { highestBox, lowestBox, practiceKey, type Mastery } from '../learning/mastery'
import { items } from '../rewards/items'
import { initialProgress, type Progress } from '../rewards/progress'

/**
 * The saved form of one profile's progress (PRD §12). Bump the version whenever the
 * shape changes, and add an upgrade step from the old version, with a test, in `readSave`.
 * 1: Task 7. 2: mastery per letter and word (Task 11).
 */
export const saveVersion = 2

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
  const { xp, roundsCompleted, completedLevels, unlockedItems, wornItem, mastery } = progress
  return {
    version: saveVersion,
    savedAt: now.toISOString(),
    progress: { xp, roundsCompleted, completedLevels, unlockedItems, wornItem, mastery },
  }
}

/** Reads whatever is stored, however old or broken; it never throws. */
export function readSave(stored: unknown): ReadResult {
  if (stored === undefined || stored === null) return { kind: 'empty' }
  if (!isRecord(stored) || !isCount(stored.version) || stored.version < 1) {
    return { kind: 'loaded', progress: initialProgress, repaired: true }
  }
  const upgraded = stored.version === 1 ? upgradeFrom1(stored.progress) : stored.progress
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
])

/** Version 1 had no mastery: everything starts unpractised. */
function upgradeFrom1(progress: unknown): unknown {
  return isRecord(progress) ? { ...progress, mastery: {} } : progress
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

  const unlockedItems = known(saved.unlockedItems, knownItems)
  let wornItem: string | null = null
  if (typeof saved.wornItem === 'string' && unlockedItems.includes(saved.wornItem)) wornItem = saved.wornItem
  else if (saved.wornItem !== null) repaired = true

  return {
    progress: {
      xp: count(saved.xp),
      roundsCompleted: count(saved.roundsCompleted),
      completedLevels: known(saved.completedLevels, knownLevels),
      unlockedItems,
      wornItem,
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
