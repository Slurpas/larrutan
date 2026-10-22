import type { ContentStatus } from './types'

export interface Letter {
  /** Stable ASCII id; never shown to the child. Answers are compared by id, never by display text. */
  id: string
  /** What the child sees: one upper-case letter (NFC-normalised, so Å is one character). */
  display: string
  /** What the voice says. Usually the letter itself; change it here if a voice mispronounces a letter. */
  spoken: string
  status: ContentStatus
}

/** Upper-case letters for Hitta bokstaven, in Swedish alphabetical order. */
export const letters: readonly Letter[] = [
  { id: 'a', display: 'A', spoken: 'A', status: 'draft' },
  { id: 'i', display: 'I', spoken: 'I', status: 'draft' },
  { id: 'l', display: 'L', spoken: 'L', status: 'draft' },
  { id: 'm', display: 'M', spoken: 'M', status: 'draft' },
  { id: 'o', display: 'O', spoken: 'O', status: 'draft' },
  { id: 's', display: 'S', spoken: 'S', status: 'draft' },
  { id: 'a-ring', display: 'Å', spoken: 'Å', status: 'draft' },
  { id: 'a-umlaut', display: 'Ä', spoken: 'Ä', status: 'draft' },
  { id: 'o-umlaut', display: 'Ö', spoken: 'Ö', status: 'draft' },
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
