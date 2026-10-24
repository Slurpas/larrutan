import { areConfusable, confusableLetters, letters } from '../../content/letters'
import type { Word } from '../../content/words'
import { practiceOrder } from '../../learning/mastery'
import type { Bubble } from './bubbleLayout'
import type { Difficulty } from '../difficulty'
import { createRng, shuffle, type Rng } from '../random'

/**
 * Bygg ordet: hear a word, see its picture, and pop its letters in order to build it.
 * The words are the approved picture words that are short enough to spell (2–4 letters);
 * the letters are shown in capitals, like everywhere in the game for now.
 */
export interface SpellingQuestion {
  /** The word's id (src/content/words.ts): also its picture. */
  word: string
  /** The word's letters in order, in capitals: ["S", "O", "L"]. */
  letters: string[]
  /** The word's letters and a few others, mixed up: what floats in the bubbles. */
  bubbles: Bubble[]
}

export interface SpellingRound {
  seed: number
  questions: SpellingQuestion[]
}

/** Extra letters per question: more of them, and look-alikes among them, at the hard level. */
export const extraLetters: Record<Difficulty, number> = { easy: 3, hard: 4 }

export function spellingWords(words: readonly Word[]): Word[] {
  return words.filter((word) => /^\p{L}{2,4}$/u.test(word.base))
}

export function lettersOf(word: Word): string[] {
  return [...word.base.toLocaleUpperCase('sv')]
}

const idOfDisplay = new Map(letters.map((letter) => [letter.display, letter.id]))
/** A and Å, O and Ö …: letters a child easily mixes up (only among the letters the game teaches). */
function lookAlike(a: string, b: string): boolean {
  const [ia, ib] = [idOfDisplay.get(a), idOfDisplay.get(b)]
  return ia !== undefined && ib !== undefined && areConfusable(ia, ib, confusableLetters)
}

export interface SpellingOptions {
  seed: number
  words: readonly Word[]
  difficulty?: Difficulty
  questionCount?: number
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox?: (word: string) => number
}

export function createSpellingRound({
  seed,
  words,
  difficulty = 'easy',
  questionCount = 5,
  practiceBox = () => 1,
}: SpellingOptions): SpellingRound {
  const rng = createRng(seed)
  const candidates = spellingWords(words)
  if (candidates.length < questionCount) throw new Error(`A round of ${questionCount} needs that many short words`)
  const pool = [...new Set(candidates.flatMap(lettersOf))]
  const picked = practiceOrder(candidates, (word) => practiceBox(word.id), rng).slice(0, questionCount)

  const questions = picked.map((word) => {
    const wordLetters = lettersOf(word)
    const extras = pickExtras(wordLetters, pool, extraLetters[difficulty], difficulty, rng)
    const bubbles = shuffle(
      [...wordLetters, ...extras].map((letter, i) => ({ id: `${letter}-${i}`, letter })),
      rng,
    )
    return { word: word.id, letters: wordLetters, bubbles }
  })
  return { seed, questions }
}

/**
 * Letters that are not in the word. Easy: none that look like a letter of the word.
 * Hard: one look-alike when there is one (Ö next to the O of "sol"), so the child must look closely.
 */
function pickExtras(word: readonly string[], pool: readonly string[], count: number, difficulty: Difficulty, rng: Rng): string[] {
  const others = shuffle(
    pool.filter((letter) => !word.includes(letter)),
    rng,
  )
  const looksLike = (letter: string) => word.some((w) => lookAlike(w, letter))
  if (difficulty === 'easy') return others.filter((letter) => !looksLike(letter)).slice(0, count)
  const tricky = others.filter(looksLike).slice(0, 1)
  return [...tricky, ...others.filter((letter) => !tricky.includes(letter))].slice(0, count)
}
