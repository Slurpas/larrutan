import type { ConfusableGroup, Letter } from '../../content/letters'
import type { Word } from '../../content/words'
import type { Difficulty } from '../difficulty'
import { pickLetterSets } from '../letterSets'
import { createRng, shuffle } from '../random'

/**
 * Sortera korten: cards dealt into piles, each card a letter or a picture. The child moves
 * top cards from pile to pile until every pile holds one letter and the pictures whose
 * words start with it (the user's idea, 2026-10-25).
 */
export interface SortingCard {
  /** Unique in the round: "letter-a" or "picture-duck". */
  id: string
  kind: 'letter' | 'picture'
  /** The set the card belongs to: its letter's id (src/content/letters.ts). */
  set: string
  /** A picture's word id. */
  word?: string
}

export interface SortingRound {
  seed: number
  /** The sets' letter ids. */
  sets: string[]
  cards: Readonly<Record<string, SortingCard>>
  /** Each pile's cards, bottom first; the last piles start empty, as room to move cards to. */
  piles: string[][]
}

/** Empty piles to start with: with more piles than sets there is always a move, and every deal can be sorted. */
export const freePiles = 2

export interface SortingOptions {
  seed: number
  words: readonly Word[]
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  sets?: number
  /** The letter and its pictures. */
  cardsPerSet?: number
  /** 'hard': two of the sets' letters look alike. */
  difficulty?: Difficulty
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox?: (word: string) => number
}

/** The letters and their pictures (`pickLetterSets`), dealt so no pile starts sorted. */
export function createSortingRound({
  seed,
  words,
  letters,
  confusables,
  sets = 3,
  cardsPerSet = 3,
  difficulty = 'easy',
  practiceBox = () => 1,
}: SortingOptions): SortingRound {
  const rng = createRng(seed)
  const picked = pickLetterSets({ rng, words, letters, confusables, sets, pictures: cardsPerSet - 1, difficulty, practiceBox })
  const cards: Record<string, SortingCard> = {}
  for (const { letter, pictures } of picked) {
    cards[`letter-${letter.id}`] = { id: `letter-${letter.id}`, kind: 'letter', set: letter.id }
    for (const word of pictures) cards[`picture-${word.id}`] = { id: `picture-${word.id}`, kind: 'picture', set: letter.id, word: word.id }
  }

  // Deal: shuffled, a pile of cardsPerSet for each set; again if any pile happens to be sorted already.
  let piles: string[][] = []
  for (let attempt = 0; attempt < 50; attempt++) {
    const deck = shuffle(Object.keys(cards), rng)
    piles = picked.map((_, i) => deck.slice(i * cardsPerSet, (i + 1) * cardsPerSet))
    if (piles.every((pile) => new Set(pile.map((id) => cards[id]!.set)).size > 1)) break
  }
  return { seed, sets: picked.map(({ letter }) => letter.id), cards, piles: [...piles, ...Array.from({ length: freePiles }, () => [])] }
}
