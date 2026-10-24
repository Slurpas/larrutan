import type { ContentStatus } from './types'

/** A word's picture is pixel art in src/art/pictures.ts, under the word's id (a test checks every word has one). */
export interface Word {
  /** Stable ASCII id (English), so Swedish wording can change without breaking anything; also names its picture. */
  id: string
  /** The word as the child hears it on its own: "sol". */
  base: string
  /** With article, for "Det där är en sol.". Some words have none ("åska"). */
  indefinite: string
  /** Definite form, for "Var är solen?". */
  definite: string
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
 * 2026-10-22; the F, N, R and T words on 2026-10-25 (docs/CONTENT_PROPOSAL.md). Every word starts with the plain sound of its first letter
 * (PRD §5); tricky words such as sked, kök, get, hjärta, djur and ljus are
 * deliberately left out.
 */
export const words: readonly Word[] = [
  // A
  { id: 'monkey', base: 'apa', indefinite: 'en apa', definite: 'apan', firstLetter: 'a', firstSound: 'a', alsoCalled: [], status: 'approved' },
  { id: 'duck', base: 'anka', indefinite: 'en anka', definite: 'ankan', firstLetter: 'a', firstSound: 'a', alsoCalled: ['and', 'fågel'], status: 'approved' },
  { id: 'pineapple', base: 'ananas', indefinite: 'en ananas', definite: 'ananasen', firstLetter: 'a', firstSound: 'a', alsoCalled: [], status: 'approved' },
  { id: 'orange', base: 'apelsin', indefinite: 'en apelsin', definite: 'apelsinen', firstLetter: 'a', firstSound: 'a', alsoCalled: ['mandarin', 'clementin'], status: 'approved' },
  // F ("fj" in fjäril starts with a plain F sound)
  { id: 'fish', base: 'fisk', indefinite: 'en fisk', definite: 'fisken', firstLetter: 'f', firstSound: 'f', alsoCalled: [], status: 'approved' },
  { id: 'butterfly', base: 'fjäril', indefinite: 'en fjäril', definite: 'fjärilen', firstLetter: 'f', firstSound: 'f', alsoCalled: [], note: 'Fj låter som ett vanligt f.', status: 'approved' },
  { id: 'foot', base: 'fot', indefinite: 'en fot', definite: 'foten', firstLetter: 'f', firstSound: 'f', alsoCalled: [], status: 'approved' },
  { id: 'sheep', base: 'får', indefinite: 'ett får', definite: 'fåret', firstLetter: 'f', firstSound: 'f', alsoCalled: ['lamm'], status: 'approved' },
  // I
  { id: 'hedgehog', base: 'igelkott', indefinite: 'en igelkott', definite: 'igelkotten', firstLetter: 'i', firstSound: 'i', alsoCalled: ['piggsvin'], status: 'approved' },
  { id: 'ice-cube', base: 'isbit', indefinite: 'en isbit', definite: 'isbiten', firstLetter: 'i', firstSound: 'i', alsoCalled: ['is'], status: 'approved' },
  // L
  { id: 'lion', base: 'lejon', indefinite: 'ett lejon', definite: 'lejonet', firstLetter: 'l', firstSound: 'l', alsoCalled: [], status: 'approved' },
  { id: 'truck', base: 'lastbil', indefinite: 'en lastbil', definite: 'lastbilen', firstLetter: 'l', firstSound: 'l', alsoCalled: ['bil'], status: 'approved' },
  { id: 'lock', base: 'lås', indefinite: 'ett lås', definite: 'låset', firstLetter: 'l', firstSound: 'l', alsoCalled: ['hänglås'], status: 'approved' },
  { id: 'leaf', base: 'löv', indefinite: 'ett löv', definite: 'lövet', firstLetter: 'l', firstSound: 'l', alsoCalled: ['blad'], status: 'approved' },
  // M
  { id: 'mouse', base: 'mus', indefinite: 'en mus', definite: 'musen', firstLetter: 'm', firstSound: 'm', alsoCalled: ['råtta'], status: 'approved' },
  { id: 'moon', base: 'måne', indefinite: 'en måne', definite: 'månen', firstLetter: 'm', firstSound: 'm', alsoCalled: [], status: 'approved' },
  { id: 'carrot', base: 'morot', indefinite: 'en morot', definite: 'moroten', firstLetter: 'm', firstSound: 'm', alsoCalled: [], status: 'approved' },
  { id: 'ant', base: 'myra', indefinite: 'en myra', definite: 'myran', firstLetter: 'm', firstSound: 'm', alsoCalled: ['insekt', 'kryp'], status: 'approved' },
  // N
  { id: 'nose', base: 'näsa', indefinite: 'en näsa', definite: 'näsan', firstLetter: 'n', firstSound: 'n', alsoCalled: [], status: 'approved' },
  { id: 'key', base: 'nyckel', indefinite: 'en nyckel', definite: 'nyckeln', firstLetter: 'n', firstSound: 'n', alsoCalled: [], status: 'approved' },
  { id: 'teddy', base: 'nalle', indefinite: 'en nalle', definite: 'nallen', firstLetter: 'n', firstSound: 'n', alsoCalled: ['björn', 'gosedjur'], status: 'approved' },
  // O
  { id: 'snake', base: 'orm', indefinite: 'en orm', definite: 'ormen', firstLetter: 'o', firstSound: 'o', alsoCalled: [], note: 'Kort o, som i "ost".', status: 'approved' },
  { id: 'cheese', base: 'ost', indefinite: 'en ost', definite: 'osten', firstLetter: 'o', firstSound: 'o', alsoCalled: [], note: 'Kort o.', status: 'approved' },
  // R
  { id: 'robot', base: 'robot', indefinite: 'en robot', definite: 'roboten', firstLetter: 'r', firstSound: 'r', alsoCalled: [], note: 'Betoning på andra stavelsen.', status: 'approved' },
  { id: 'fox', base: 'räv', indefinite: 'en räv', definite: 'räven', firstLetter: 'r', firstSound: 'r', alsoCalled: [], status: 'approved' },
  { id: 'rocket', base: 'raket', indefinite: 'en raket', definite: 'raketen', firstLetter: 'r', firstSound: 'r', alsoCalled: ['rymdskepp'], note: 'Betoning på andra stavelsen.', status: 'approved' },
  { id: 'rose', base: 'ros', indefinite: 'en ros', definite: 'rosen', firstLetter: 'r', firstSound: 'r', alsoCalled: ['blomma'], status: 'approved' },
  // S
  { id: 'sun', base: 'sol', indefinite: 'en sol', definite: 'solen', firstLetter: 's', firstSound: 's', alsoCalled: [], status: 'approved' },
  { id: 'scissors', base: 'sax', indefinite: 'en sax', definite: 'saxen', firstLetter: 's', firstSound: 's', alsoCalled: [], status: 'approved' },
  { id: 'snail', base: 'snigel', indefinite: 'en snigel', definite: 'snigeln', firstLetter: 's', firstSound: 's', alsoCalled: ['snäcka'], status: 'approved' },
  { id: 'shoe', base: 'sko', indefinite: 'en sko', definite: 'skon', firstLetter: 's', firstSound: 's', alsoCalled: ['gympasko'], note: 'sk före o är ett vanligt s + k, inte sj-ljud.', status: 'approved' },
  // T
  { id: 'train', base: 'tåg', indefinite: 'ett tåg', definite: 'tåget', firstLetter: 't', firstSound: 't', alsoCalled: ['lok'], status: 'approved' },
  { id: 'tooth', base: 'tand', indefinite: 'en tand', definite: 'tanden', firstLetter: 't', firstSound: 't', alsoCalled: [], status: 'approved' },
  { id: 'tomato', base: 'tomat', indefinite: 'en tomat', definite: 'tomaten', firstLetter: 't', firstSound: 't', alsoCalled: [], note: 'Betoning på andra stavelsen.', status: 'approved' },
  { id: 'tiger', base: 'tiger', indefinite: 'en tiger', definite: 'tigern', firstLetter: 't', firstSound: 't', alsoCalled: ['lejon'], note: 'Visas aldrig ihop med lejonet i Ord och bild.', status: 'approved' },
  // Å
  { id: 'eight', base: 'åtta', indefinite: 'en åtta', definite: 'åttan', firstLetter: 'a-ring', firstSound: 'å', alsoCalled: [], note: 'Siffran 8.', status: 'approved' },
  { id: 'thunder', base: 'åska', indefinite: 'åska', definite: 'åskan', firstLetter: 'a-ring', firstSound: 'å', alsoCalled: ['blixt', 'moln', 'regn'], note: 'Osäker bild: barn kan säga "blixt" eller "moln".', status: 'approved' },
  // Ä
  { id: 'apple', base: 'äpple', indefinite: 'ett äpple', definite: 'äpplet', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: [], status: 'approved' },
  { id: 'egg', base: 'ägg', indefinite: 'ett ägg', definite: 'ägget', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: [], status: 'approved' },
  { id: 'angel', base: 'ängel', indefinite: 'en ängel', definite: 'ängeln', firstLetter: 'a-umlaut', firstSound: 'ä', alsoCalled: ['bebis'], status: 'approved' },
  // Ö
  { id: 'eye', base: 'öga', indefinite: 'ett öga', definite: 'ögat', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: [], status: 'approved' },
  { id: 'ear', base: 'öra', indefinite: 'ett öra', definite: 'örat', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: [], status: 'approved' },
  { id: 'island', base: 'ö', indefinite: 'en ö', definite: 'ön', firstLetter: 'o-umlaut', firstSound: 'ö', alsoCalled: ['strand', 'palm'], status: 'approved' },
]

const wordsById = new Map(words.map((word) => [word.id, word]))

export function getWord(id: string): Word {
  const word = wordsById.get(id)
  if (!word) throw new Error(`Unknown word id "${id}"`)
  return word
}

/** True if a child could reasonably call one picture by the other's name. */
export function couldBeMistaken(a: Word, b: Word): boolean {
  return a.id === b.id || a.alsoCalled.includes(b.base) || b.alsoCalled.includes(a.base)
}
