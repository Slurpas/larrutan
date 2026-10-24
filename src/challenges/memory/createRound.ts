import { areConfusable, type ConfusableGroup, type Letter } from '../../content/letters'
import type { Word } from '../../content/words'
import { practiceOrder } from '../../learning/mastery'
import type { Difficulty } from '../difficulty'
import { createRng, shuffle } from '../random'

/**
 * Memory: cards face down, in pairs of a picture and the letter its word starts with
 * (the duck and A). The child turns two cards at a time; a pair stays face up.
 */
export interface MemoryCard {
  /** Unique on the board: "letter-a" or "picture-duck". */
  id: string
  kind: 'letter' | 'picture'
  /** The pair's word id: the picture, and the word whose first letter the letter card shows. */
  pair: string
  /** The letter's id (src/content/letters.ts). */
  letter: string
}

export interface MemoryRound {
  seed: number
  /** The pairs' word ids. */
  pairs: string[]
  /** Face down, in their places on the board. */
  cards: MemoryCard[]
}

/** Pairs on the board: more on the hard level, with two letters that look alike among them. */
export const pairCounts: Record<Difficulty, number> = { easy: 3, hard: 4 }

export interface MemoryOptions {
  seed: number
  words: readonly Word[]
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  difficulty?: Difficulty
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox?: (word: string) => number
}

/**
 * The pairs' letters are all different, so a letter card matches exactly one picture.
 * Easy: no two of them are easy to mix up. Hard: two that look alike (A and Ä, O and Ö).
 */
export function createMemoryRound({
  seed,
  words,
  letters,
  confusables,
  difficulty = 'easy',
  practiceBox = () => 1,
}: MemoryOptions): MemoryRound {
  const rng = createRng(seed)
  const count = pairCounts[difficulty]
  const taught = new Set(letters.map((letter) => letter.id))
  const candidates = practiceOrder(
    words.filter((word) => taught.has(word.firstLetter)),
    (word) => practiceBox(word.id),
    rng,
  )
  const mixedUp = (a: string, b: string) => areConfusable(a, b, confusables)
  const looks = confusables.filter((group) => group.reason === 'looks')
  const lookAlike = (a: string, b: string) => a !== b && areConfusable(a, b, looks)

  const picked: Word[] = []
  if (difficulty === 'hard') {
    const first = candidates.find((word) => candidates.some((other) => lookAlike(word.firstLetter, other.firstLetter)))
    const partner = first && candidates.find((other) => lookAlike(first.firstLetter, other.firstLetter))
    if (first && partner) picked.push(first, partner)
  }
  for (const word of candidates) {
    if (picked.length === count) break
    if (picked.some((p) => p.firstLetter === word.firstLetter)) continue
    if (difficulty === 'easy' && picked.some((p) => mixedUp(p.firstLetter, word.firstLetter))) continue
    picked.push(word)
  }
  if (picked.length < count) throw new Error(`A Memory board of ${count} pairs needs that many different first letters`)

  const cards = shuffle(
    picked.flatMap((word): MemoryCard[] => [
      { id: `letter-${word.firstLetter}`, kind: 'letter', pair: word.id, letter: word.firstLetter },
      { id: `picture-${word.id}`, kind: 'picture', pair: word.id, letter: word.firstLetter },
    ]),
    rng,
  )
  return { seed, pairs: picked.map((word) => word.id), cards }
}
