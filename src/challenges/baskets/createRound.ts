import type { ConfusableGroup, Letter } from '../../content/letters'
import type { Word } from '../../content/words'
import type { Difficulty } from '../difficulty'
import { pickLetterSets } from '../letterSets'
import { createRng, shuffle } from '../random'

/**
 * Bokstavskorgarna: a basket for each letter, standing in its place from the start, and the
 * pictures dealt into piles. The child puts every picture in the basket of the letter its
 * word starts with (the user's idea, 2026-10-26).
 */
export interface BasketCard {
  /** Unique in the round: "picture-duck". */
  id: string
  /** The basket it belongs in: its letter's id (src/content/letters.ts). */
  set: string
  word: string
}

export interface BasketsRound {
  seed: number
  /** The baskets' letter ids, in alphabet order. */
  sets: string[]
  cards: Readonly<Record<string, BasketCard>>
  /** Each pile's pictures, bottom first. */
  piles: string[][]
}

export interface BasketsOptions {
  seed: number
  words: readonly Word[]
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  sets?: number
  picturesPerSet?: number
  piles?: number
  /** 'hard': two of the letters look alike. */
  difficulty?: Difficulty
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox?: (word: string) => number
}

/** The letters and their pictures (`pickLetterSets`), the pictures shuffled and dealt into piles one by one. */
export function createBasketsRound({
  seed,
  words,
  letters,
  confusables,
  sets = 3,
  picturesPerSet = 2,
  piles = 6,
  difficulty = 'easy',
  practiceBox = () => 1,
}: BasketsOptions): BasketsRound {
  const rng = createRng(seed)
  const picked = pickLetterSets({ rng, words, letters, confusables, sets, pictures: picturesPerSet, difficulty, practiceBox })
  const cards: Record<string, BasketCard> = {}
  for (const { letter, pictures } of picked) {
    for (const word of pictures) cards[`picture-${word.id}`] = { id: `picture-${word.id}`, set: letter.id, word: word.id }
  }
  const dealt: string[][] = Array.from({ length: piles }, () => [])
  shuffle(Object.keys(cards), rng).forEach((id, i) => dealt[i % piles]!.push(id))
  const order = picked.map(({ letter }) => letter).sort((a, b) => a.display.localeCompare(b.display, 'sv'))
  return { seed, sets: order.map((letter) => letter.id), cards, piles: dealt }
}
