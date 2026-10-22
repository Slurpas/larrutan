import { areConfusable, type ConfusableGroup, type Letter } from '../../content/letters'
import { alsoCalledLetters, findWordProblems } from '../../content/validation'
import type { Word } from '../../content/words'
import {
  assertNoProblems,
  choicePairs,
  findChoiceProblems,
  pickChoices,
  type ChoiceQuestion,
  type ChoiceRound,
} from '../choiceQuestion'
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
}

export interface FirstLetterOptions extends Omit<FirstLetterRules, 'choiceCount'> {
  seed: number
  questionCount?: number
  choiceCount?: number
}

/**
 * Första bokstaven: see a picture, hear the word, tap its first letter.
 * Each question in a round uses a different first letter, look-alike letters
 * are never mixed, and no wrong letter matches another name for the picture.
 */
export function createFirstLetterRound({
  seed,
  words,
  letters,
  confusables,
  questionCount = 5,
  choiceCount = 3,
}: FirstLetterOptions): ChoiceRound<FirstLetterQuestion> {
  const rng = createRng(seed)
  const rules = { words, letters, confusables, choiceCount }

  const picked: Word[] = []
  for (const word of shuffle(words, rng)) {
    if (picked.length === questionCount) break
    if (!picked.some((p) => p.firstLetter === word.firstLetter)) picked.push(word)
  }
  if (picked.length < questionCount) {
    throw new Error(`A round of ${questionCount} needs words with that many different first letters`)
  }

  const letterIds = letters.map((letter) => letter.id)
  const questions = picked.map((word) => {
    const misleading = alsoCalledLetters(word, letters)
    const choices = pickChoices(
      word.firstLetter,
      letterIds,
      choiceCount,
      rng,
      (candidate, chosen) =>
        !misleading.has(candidate) && chosen.every((choice) => !areConfusable(choice, candidate, confusables)),
    )
    const question = { word: word.id, target: word.firstLetter, choices }
    assertNoProblems(findFirstLetterProblems(question, rules), `"${word.base}" (seed ${seed})`)
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
  for (const [a, b] of choicePairs(question.choices)) {
    if (areConfusable(a, b, rules.confusables)) problems.push(`"${a}" and "${b}" are easy to mix up`)
  }
  return problems
}
