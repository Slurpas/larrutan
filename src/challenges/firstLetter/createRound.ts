import { lookAlikesOf, type ConfusableGroup, type Letter } from '../../content/letters'
import { alsoCalledLetters, findWordProblems } from '../../content/validation'
import type { Word } from '../../content/words'
import { assertNoProblems, findChoiceProblems, type ChoiceQuestion, type ChoiceRound } from '../choiceQuestion'
import type { Difficulty } from '../difficulty'
import { findLookAlikeProblems, pickLetterChoices } from '../letterChoices'
import { createRng, shuffle } from '../random'

export interface FirstLetterQuestion extends ChoiceQuestion {
  /** Id of the word whose picture is shown and whose first letter the child finds. */
  word: string
}

interface FirstLetterRules {
  words: readonly Word[]
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  choiceCount: number
  difficulty: Difficulty
}

export interface FirstLetterOptions extends Omit<FirstLetterRules, 'choiceCount' | 'difficulty'> {
  seed: number
  difficulty?: Difficulty
  questionCount?: number
  choiceCount?: number
}

/**
 * Första bokstaven: see a picture, hear the word, tap its first letter.
 * Each question in a round uses a different first letter, and no wrong letter
 * matches another name for the picture. Easy: no look-alike letters. Hard:
 * words starting with letters that have look-alikes, and one look-alike offered.
 */
export function createFirstLetterRound({
  seed,
  words,
  letters,
  confusables,
  difficulty = 'easy',
  questionCount = 5,
  choiceCount = 3,
}: FirstLetterOptions): ChoiceRound<FirstLetterQuestion> {
  const rng = createRng(seed)
  const rules = { words, letters, confusables, choiceCount, difficulty }

  const hasLookAlikes = (word: Word) => lookAlikesOf(word.firstLetter, confusables).length > 0
  const candidates =
    difficulty === 'hard'
      ? [...shuffle(words.filter(hasLookAlikes), rng), ...shuffle(words.filter((w) => !hasLookAlikes(w)), rng)]
      : shuffle(words, rng)

  const picked: Word[] = []
  for (const word of candidates) {
    if (picked.length === questionCount) break
    if (!picked.some((p) => p.firstLetter === word.firstLetter)) picked.push(word)
  }
  if (picked.length < questionCount) {
    throw new Error(`A round of ${questionCount} needs words with that many different first letters`)
  }

  const letterIds = letters.map((letter) => letter.id)
  const questions = picked.map((word) => {
    const misleading = alsoCalledLetters(word, letters)
    const choices = pickLetterChoices({
      target: word.firstLetter,
      pool: letterIds.filter((id) => !misleading.has(id)),
      count: choiceCount,
      rng,
      confusables,
      difficulty,
    })
    const question = { word: word.id, target: word.firstLetter, choices }
    assertNoProblems(findFirstLetterProblems(question, rules), `"${word.base}" (seed ${seed}, ${difficulty})`)
    return question
  })

  return { seed, questions }
}

export function findFirstLetterProblems(question: FirstLetterQuestion, rules: FirstLetterRules): string[] {
  const problems = findChoiceProblems(question, rules.choiceCount, new Set(rules.letters.map((l) => l.id)))
  const word = rules.words.find((w) => w.id === question.word)
  if (!word) return [...problems, `unknown word "${question.word}"`]

  problems.push(...findWordProblems(word, rules.letters))
  if (question.target !== word.firstLetter) problems.push(`"${word.base}" does not start with "${question.target}"`)

  const misleading = alsoCalledLetters(word, rules.letters)
  for (const choice of question.choices) {
    if (misleading.has(choice)) {
      problems.push(`"${choice}" could also be right: the picture of "${word.base}" has another name starting with it`)
    }
  }
  problems.push(...findLookAlikeProblems(question.target, question.choices, rules.confusables, rules.difficulty))
  return problems
}
