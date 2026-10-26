import { areConfusable, type ConfusableGroup, type Letter } from '../../content/letters'
import { alsoCalledLetters } from '../../content/validation'
import type { Word } from '../../content/words'
import { practiceOrder } from '../../learning/mastery'
import type { Difficulty } from '../difficulty'
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

/**
 * Letters with enough words, never two that are easy to mix up on the easy levels (two that
 * look alike on the hard ones), and no picture that another name links to another set's
 * letter (the train, "lok", never in a round with L). Dealt so no pile starts sorted.
 */
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
  const pictures = cardsPerSet - 1
  const wordsOf = (letter: string) => words.filter((word) => word.firstLetter === letter)
  const box = (letter: Letter) => Math.min(...wordsOf(letter.id).map((word) => practiceBox(word.id)))
  const candidates = practiceOrder(
    letters.filter((letter) => wordsOf(letter.id).length >= pictures),
    box,
    rng,
  )
  const looks = confusables.filter((group) => group.reason === 'looks')
  const lookAlike = (a: string, b: string) => a !== b && areConfusable(a, b, looks)
  /** A letter's pictures that no other name links to another letter of the round. */
  const fittingWords = (letter: string, round: readonly Letter[]) =>
    wordsOf(letter).filter((word) => ![...alsoCalledLetters(word, letters)].some((other) => other !== letter && round.some((r) => r.id === other)))
  /** Every letter keeps enough pictures with these letters together. */
  const fits = (round: readonly Letter[]) => round.every((letter) => fittingWords(letter.id, round).length >= pictures)

  const chosen: Letter[] = []
  if (difficulty === 'hard') {
    const pair = candidates.flatMap((first) => candidates.filter((other) => lookAlike(first.id, other.id) && fits([first, other])).map((other) => [first, other]))[0]
    if (pair) chosen.push(...pair)
  }
  for (const letter of candidates) {
    if (chosen.length === sets) break
    if (chosen.includes(letter) || !fits([...chosen, letter])) continue
    if (difficulty === 'easy' && chosen.some((c) => areConfusable(c.id, letter.id, confusables))) continue
    chosen.push(letter)
  }
  if (chosen.length < sets) throw new Error(`A round of ${sets} sets needs that many letters with ${pictures} words each`)

  // Pictures for each letter, none with another name that starts with another set's letter.
  const cards: Record<string, SortingCard> = {}
  for (const letter of chosen) {
    cards[`letter-${letter.id}`] = { id: `letter-${letter.id}`, kind: 'letter', set: letter.id }
    const fitting = fittingWords(letter.id, chosen)
    const picked = practiceOrder(fitting, (word) => practiceBox(word.id), rng).slice(0, pictures)
    if (picked.length < pictures) throw new Error(`"${letter.id}" has only ${picked.length} pictures that fit this round`)
    for (const word of picked) cards[`picture-${word.id}`] = { id: `picture-${word.id}`, kind: 'picture', set: letter.id, word: word.id }
  }

  // Deal: shuffled, a pile of cardsPerSet for each set; again if any pile happens to be sorted already.
  let piles: string[][] = []
  for (let attempt = 0; attempt < 50; attempt++) {
    const deck = shuffle(Object.keys(cards), rng)
    piles = chosen.map((_, i) => deck.slice(i * cardsPerSet, (i + 1) * cardsPerSet))
    if (piles.every((pile) => new Set(pile.map((id) => cards[id]!.set)).size > 1)) break
  }
  return { seed, sets: chosen.map((letter) => letter.id), cards, piles: [...piles, ...Array.from({ length: freePiles }, () => [])] }
}
