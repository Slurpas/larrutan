import { areConfusable, type ConfusableGroup, type Letter } from '../content/letters'
import { alsoCalledLetters } from '../content/validation'
import type { Word } from '../content/words'
import { practiceOrder } from '../learning/mastery'
import type { Difficulty } from './difficulty'

export interface LetterSetOptions {
  rng: () => number
  words: readonly Word[]
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  sets: number
  /** Pictures for each letter. */
  pictures: number
  /** 'hard': two of the letters look alike. */
  difficulty: Difficulty
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox: (word: string) => number
}

/** A letter, and the pictures of words that start with it. */
export interface LetterSet {
  letter: Letter
  pictures: Word[]
}

/**
 * The letters of a round where pictures are sorted by their first letter (Sortera korten,
 * Bokstavskorgarna), each with its pictures: letters with enough words, never two that are
 * easy to mix up on the easy levels (two that look alike on the hard ones), and no picture
 * that another name links to another letter of the round (the train, "lok", never in a
 * round with L).
 */
export function pickLetterSets({ rng, words, letters, confusables, sets, pictures, difficulty, practiceBox }: LetterSetOptions): LetterSet[] {
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

  const allowed = (round: readonly Letter[], letter: Letter) =>
    !round.includes(letter) && fits([...round, letter]) && (difficulty !== 'easy' || !round.some((c) => areConfusable(c.id, letter.id, confusables)))
  /**
   * The first way, in practice order, to pick enough letters: one by one, going back when the
   * letters picked leave no way on. Other names tie letters together: with L and M picked,
   * only S is left of the letters with four pictures ("lok" ties T to L, "råtta" M to R, …).
   */
  const complete = (round: Letter[], from: number): Letter[] | undefined => {
    if (round.length === sets) return round
    for (let i = from; i < candidates.length; i++) {
      const done = allowed(round, candidates[i]!) ? complete([...round, candidates[i]!], i + 1) : undefined
      if (done) return done
    }
    return undefined
  }
  // The hard levels start from two letters that look alike: the first pair that works.
  const pairs = difficulty === 'hard' ? candidates.flatMap((first) => candidates.filter((other) => lookAlike(first.id, other.id) && fits([first, other])).map((other) => [first, other])) : []
  const chosen = [...pairs, []].reduce<Letter[] | undefined>((found, start) => found ?? complete(start, 0), undefined)
  if (!chosen) throw new Error(`A round of ${sets} sets needs that many letters with ${pictures} words each`)

  // Pictures for each letter, none with another name that starts with another letter of the round.
  return chosen.map((letter) => {
    const picked = practiceOrder(fittingWords(letter.id, chosen), (word) => practiceBox(word.id), rng).slice(0, pictures)
    if (picked.length < pictures) throw new Error(`"${letter.id}" has only ${picked.length} pictures that fit this round`)
    return { letter, pictures: picked }
  })
}
