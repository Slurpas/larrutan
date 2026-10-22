import { areConfusable, type ConfusableGroup, type Letter } from '../../content/letters'
import {
  assertNoProblems,
  choicePairs,
  findChoiceProblems,
  pickChoices,
  type ChoiceQuestion,
  type ChoiceRound,
} from '../choiceQuestion'
import { createRng, shuffle } from '../random'

interface FindLetterRules {
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  choiceCount: number
}

export interface FindLetterOptions extends Omit<FindLetterRules, 'choiceCount'> {
  seed: number
  questionCount?: number
  choiceCount?: number
}

/**
 * Hitta bokstaven, easy level: each target appears once per round, and no two
 * choices in a question look or sound alike.
 */
export function createFindLetterRound({
  seed,
  letters,
  confusables,
  questionCount = 5,
  choiceCount = 3,
}: FindLetterOptions): ChoiceRound {
  if (questionCount > letters.length) {
    throw new Error(`A round of ${questionCount} needs at least that many letters, got ${letters.length}`)
  }

  const rng = createRng(seed)
  const ids = letters.map((letter) => letter.id)
  const rules = { letters, confusables, choiceCount }

  const questions = shuffle(ids, rng)
    .slice(0, questionCount)
    .map((target) => {
      const choices = pickChoices(target, ids, choiceCount, rng, (candidate, chosen) =>
        chosen.every((choice) => !areConfusable(choice, candidate, confusables)),
      )
      const question = { target, choices }
      assertNoProblems(findFindLetterProblems(question, rules), `"${target}" (seed ${seed})`)
      return question
    })

  return { seed, questions }
}

export function findFindLetterProblems(question: ChoiceQuestion, rules: FindLetterRules): string[] {
  const problems = findChoiceProblems(question, rules.choiceCount, new Set(rules.letters.map((l) => l.id)))
  for (const [a, b] of choicePairs(question.choices)) {
    if (areConfusable(a, b, rules.confusables)) problems.push(`"${a}" and "${b}" are easy to mix up`)
  }
  return problems
}
