import type { ContentStatus } from './types'

export interface Word {
  /** Stable ASCII id (English), so Swedish wording can change without breaking anything. */
  id: string
  /** The word as the child hears it on its own: "sol". */
  base: string
  /** With article, for "Det där är en sol.". Some words have none ("åska"). */
  indefinite: string
  /** Definite form, for "Var är solen?". */
  definite: string
  /** Placeholder picture (emoji) until Phase 2 art. Avoid emoji newer than Unicode 13 (older iPads). */
  picture: string
  /** Id of the letter the word starts with. */
  firstLetter: string
  /** The sound the word starts with, in the same notation as Letter.sound. */
  firstSound: string
  /** Other names a child might use for the picture; they must never make a wrong choice right. */
  alsoCalled: readonly string[]
  /** For the reviewer: anything worth checking. */
  note?: string
  status: ContentStatus
}

/**
 * Picturable words for Första bokstaven and Ord och bild, approved by the user
 * 2026-10-22. Every word starts with the plain sound of its first letter
 * (PRD §5); tricky words such as sked, kök, get, hjärta, djur and ljus are
 * deliberately left out.
 */
export const words: readonly Word[] = [
  // A
  { id: 'monkey', base: 'apa', indefinite: 'en apa', definite: 'apan', picture: '🐒', firstLetter: 'a', firstSound: 'a', alsoCalled: [], status: 'approved' },
  { id: 'duck', base: 'anka', indefinite: 'en anka', definite: 'ankan', picture: '🦆', firstLetter: 'a', firstSound: 'a', alsoCalled: ['and', 'fågel'], status: 'approved' },
  { id: 'pineapple', base: 'ananas', indefinite: 'en ananas', definite: 'ananasen', picture: '🍍', firstLetter: 'a', firstSound: 'a', alsoCalled: [], status: 'approved' },
  { id: 'orange', base: 'apelsin', indefinite: 'en apelsin', definite: 'apelsinen', picture: '🍊', firstLetter: 'a', firstSound: 'a', alsoCalled: ['mandarin', 'clementin'], status: 'approved' },
  // I
  { id: 'hedgehog', base: 'igelkott', indefinite: 'en igelkott', definite: 'igelkotten', picture: '🦔', firstLetter: 'i', firstSound: 'i', alsoCalled: ['piggsvin'], status: 'approved' },
  { id: 'ice-cube', base: 'isbit', indefinite: 'en isbit', definite: 'isbiten', picture: '🧊', firstLetter: 'i', firstSound: 'i', alsoCalled: ['is'], status: 'approved' },
  // L
  { id: 'lion', base: 'lejon', indefinite: 'ett lejon', definite: 'lejonet', picture: '🦁', firstLetter: 'l', firstSound: 'l', alsoCalled: [], status: 'approved' },
  { id: 'truck', base: 'lastbil', indefinite: 'en lastbil', definite: 'lastbilen', picture: '🚚', firstLetter: 'l', firstSound: 'l', alsoCalled: ['bil'], status: 'approved' },
  { id: 'lock', base: 'lås', indefinite: 'ett lås', definite: 'låset', picture: '🔒', firstLetter: 'l', firstSound: 'l', alsoCalled: ['hänglås'], status: 'approved' },
  { id: 'leaf', base: 'löv', indefinite: 'ett löv', definite: 'lövet', picture: '🍁', firstLetter: 'l', firstSound: 'l', alsoCalled: ['blad'], status: 'approved' },
  // M
  { id: 'mouse', base: 'mus', indefinite: 'en mus', definite: 'musen', picture: '🐭', firstLetter: 'm', firstSound: 'm', alsoCalled: ['råtta'], status: 'approved' },
  { id: 'moon', base: 'måne', indefinite: 'en måne', definite: 'månen', picture: '🌙', firstLetter: 'm', firstSound: 'm', alsoCalled: [], status: 'approved' },
  { id: 'carrot', base: 'morot', indefinite: 'en morot', definite: 'moroten', picture: '🥕', firstLetter: 'm', firstSound: 'm', alsoCalled: [], status: 'approved' },
  { id: 'ant', base: 'myra', indefinite: 'en myra', definite: 'myran', picture: '🐜', firstLetter: 'm', firstSound: 'm', alsoCalled: ['insekt', 'kryp'], status: 'approved' },
  // O
  { id: 'snake', base: 'orm', indefinite: 'en orm', definite: 'ormen', picture: '🐍', firstLetter: 'o', firstSound: 'o', alsoCalled: [], note: 'Kort o, som i "ost".', status: 'approved' },
  { id: 'cheese', base: 'ost', indefinite: 'en ost', definite: 'osten', picture: '🧀', firstLetter: 'o', firstSound: 'o', alsoCalled: [], note: 'Kort o.', status: 'approved' },
  // S
  { id: 'sun', base: 'sol', indefinite: 'en sol', definite: 'solen', picture: '☀️', firstLetter: 's', firstSound: 's', alsoCalled: [], status: 'approved' },
  { id: 'scissors', base: 'sax', indefinite: 'en sax', definite: 'saxen', picture: '✂️', firstLetter: 's', firstSound: 's', alsoCalled: [], status: 'approved' },
  { id: 'snail', base: 'snigel', indefinite: 'en snigel', definite: 'snigeln', picture: '🐌', firstLetter: 's', firstSound: 's', alsoCalled: ['snäcka'], status: 'approved' },
  { id: 'shoe', base: 'sko', indefinite: 'en sko', definite: 'skon', picture: '👟', firstLetter: 's', firstSound: 's', alsoCalled: ['gympasko'], note: 'sk före o är ett vanligt s + k, inte sj-ljud.', status: 'approved' },
  // Å
  { id: 'eight', base: 'åtta', indefinite: 'en åtta', definite: 'åttan', picture: '8️⃣', firstLetter: 'a-ring', firstSound: 'å', alsoCalled: [], note: 'Siffran 8.', status: 'approved' },
  { id: 'thunder', base: 'åska', indefinite: 'åska', definite: 'åskan', picture: '⛈️', firstLetter: 'a-ring', firstSound: 'å', alsoCalled: ['blixt', 'moln', 'regn'], note: 'Osäker bild: barn kan säga "blixt" eller "moln".', status: 'approved' },
  // Ä
  { id: 'apple', base: 'äpple', indefinite: 'ett äpple', definite: 'äpplet', picture: '🍎', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: [], status: 'approved' },
  { id: 'egg', base: 'ägg', indefinite: 'ett ägg', definite: 'ägget', picture: '🥚', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: [], status: 'approved' },
  { id: 'angel', base: 'ängel', indefinite: 'en ängel', definite: 'ängeln', picture: '👼', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: ['bebis'], status: 'approved' },
  // Ö
  { id: 'eye', base: 'öga', indefinite: 'ett öga', definite: 'ögat', picture: '👁️', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: [], status: 'approved' },
  { id: 'ear', base: 'öra', indefinite: 'ett öra', definite: 'örat', picture: '👂', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: [], status: 'approved' },
  { id: 'island', base: 'ö', indefinite: 'en ö', definite: 'ön', picture: '🏝️', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: ['strand', 'palm'], status: 'approved' },
]

const wordsById = new Map(words.map((word) => [word.id, word]))

export function getWord(id: string): Word {
  const word = wordsById.get(id)
  if (!word) throw new Error(`Unknown word id "${id}"`)
  return word
}

/** True if a child could reasonably call one picture by the other's name. */
export function couldBeMistaken(a: Word, b: Word): boolean {
  return a.picture === b.picture || a.alsoCalled.includes(b.base) || b.alsoCalled.includes(a.base)
}
