import type { ContentStatus } from './types'

export interface Letter {
  /** Stable ASCII id; never shown to the child. Answers are compared by id, never by display text. */
  id: string
  /** What the child sees: one upper-case letter (NFC-normalised, so Å is one character). */
  display: string
  /** What the voice says. Usually the letter itself; change it here if a voice mispronounces a letter. */
  spoken: string
  /**
   * The letter's plain sound, used to check that a word really starts with it.
   * Other sounds are written as their Swedish names: "sj", "tj", "j" and so on.
   */
  sound: string
  status: ContentStatus
}

/** Upper-case letters, in Swedish alphabetical order. Approved by the user 2026-10-22. */
export const letters: readonly Letter[] = [
  { id: 'a', display: 'A', spoken: 'A', sound: 'a', status: 'approved' },
  { id: 'i', display: 'I', spoken: 'I', sound: 'i', status: 'approved' },
  { id: 'l', display: 'L', spoken: 'L', sound: 'l', status: 'approved' },
  { id: 'm', display: 'M', spoken: 'M', sound: 'm', status: 'approved' },
  { id: 'o', display: 'O', spoken: 'O', sound: 'o', status: 'approved' },
  { id: 's', display: 'S', spoken: 'S', sound: 's', status: 'approved' },
  { id: 'a-ring', display: 'Å', spoken: 'Å', sound: 'å', status: 'approved' },
  { id: 'a-umlaut', display: 'Ä', spoken: 'Ä', sound: 'ä', status: 'approved' },
  { id: 'o-umlaut', display: 'Ö', spoken: 'Ö', sound: 'ö', status: 'approved' },
]

export interface ConfusableGroup {
  ids: readonly string[]
  /** Why these letters are easy to mix up. */
  reason: 'looks' | 'sounds'
}

/**
 * Letters that are easy to mix up. At the easy level no two choices in a
 * question may share a group; harder levels can use them on purpose (PRD §5).
 */
export const confusableLetters: readonly ConfusableGroup[] = [
  { ids: ['a', 'a-ring', 'a-umlaut'], reason: 'looks' },
  { ids: ['o', 'o-umlaut'], reason: 'looks' },
  // The letter names "o" and "å" sound close, and O is often pronounced like Å.
  { ids: ['o', 'a-ring'], reason: 'sounds' },
]

const lettersById = new Map(letters.map((letter) => [letter.id, letter]))

export function getLetter(id: string): Letter {
  const letter = lettersById.get(id)
  if (!letter) throw new Error(`Unknown letter id "${id}"`)
  return letter
}

export function areConfusable(a: string, b: string, groups: readonly ConfusableGroup[]): boolean {
  return groups.some((group) => group.ids.includes(a) && group.ids.includes(b))
}

/** Letters that are easy to mix up with this one (e.g. Å and Ä for A). */
export function lookAlikesOf(id: string, groups: readonly ConfusableGroup[]): string[] {
  const result = new Set<string>()
  for (const group of groups) {
    if (group.ids.includes(id)) for (const other of group.ids) if (other !== id) result.add(other)
  }
  return [...result]
}

/** The id of the letter a word or name starts with, if it is one of ours. */
export function firstLetterOf(text: string, from: readonly Letter[]): string | undefined {
  const first = text.normalize('NFC').charAt(0).toLocaleUpperCase('sv')
  return from.find((letter) => letter.display === first)?.id
}
