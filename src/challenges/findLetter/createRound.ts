import type { ConfusableGroup, Letter } from '../../content/letters'
import { assertNoProblems, findChoiceProblems, type ChoiceQuestion, type ChoiceRound } from '../choiceQuestion'
import type { Difficulty } from '../difficulty'
import { findLookAlikeProblems, hardTargetsFirst, pickLetterChoices } from '../letterChoices'
import { createRng, shuffle } from '../random'

interface FindLetterRules {
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  choiceCount: number
  difficulty: Difficulty
}

export interface FindLetterOptions extends Omit<FindLetterRules, 'choiceCount' | 'difficulty'> {
  seed: number
  difficulty?: Difficulty
  questionCount?: number
  choiceCount?: number
}

/**
 * Hitta bokstaven. Each target appears once per round. Easy: no look-alikes.
 * Hard: asks about letters with look-alikes first, and offers one of them.
 */
export function createFindLetterRound({
  seed,
  letters,
  confusables,
  difficulty = 'easy',
  questionCount = 5,
  choiceCount = 3,
}: FindLetterOptions): ChoiceRound {
  if (questionCount > letters.length) {
    throw new Error(`A round of ${questionCount} needs at least that many letters, got ${letters.length}`)
  }

  const rng = createRng(seed)
  const ids = letters.map((letter) => letter.id)
  const rules = { letters, confusables, choiceCount, difficulty }
  const targets = difficulty === 'hard' ? hardTargetsFirst(ids, confusables, rng) : shuffle(ids, rng)

  const questions = targets.slice(0, questionCount).map((target) => {
    const choices = pickLetterChoices({ target, pool: ids, count: choiceCount, rng, confusables, difficulty })
    const question = { target, choices }
    assertNoProblems(findFindLetterProblems(question, rules), `"${target}" (seed ${seed}, ${difficulty})`)
    return question
  })

  return { seed, questions }
}

export function findFindLetterProblems(question: ChoiceQuestion, rules: FindLetterRules): string[] {
  return [
    ...findChoiceProblems(question, rules.choiceCount, new Set(rules.letters.map((l) => l.id))),
    ...findLookAlikeProblems(question.target, question.choices, rules.confusables, rules.difficulty),
  ]
}
