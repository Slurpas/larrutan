import type { ConfusableGroup, Letter } from '../../content/letters'
import { createRng, shuffle } from '../random'

export interface FindLetterQuestion {
  /** Id of the letter the child is asked to find. */
  target: string
  /** Letter ids in display order; contains the target exactly once. */
  choices: string[]
}

export interface FindLetterRound {
  seed: number
  questions: FindLetterQuestion[]
}

interface RoundRules {
  letters: readonly Letter[]
  confusables: readonly ConfusableGroup[]
  choiceCount: number
}

export interface FindLetterOptions extends Omit<RoundRules, 'choiceCount'> {
  seed: number
  questionCount?: number
  choiceCount?: number
}

/**
 * Builds a round of easy-level questions: each target appears once per round,
 * and no two choices in a question look or sound alike. Every question is
 * validated; an impossible round throws instead of showing a broken question.
 */
export function createFindLetterRound({
  seed,
  letters,
  confusables,
  questionCount = 5,
  choiceCount = 3,
}: FindLetterOptions): FindLetterRound {
  if (questionCount > letters.length) {
    throw new Error(`A round of ${questionCount} needs at least that many letters, got ${letters.length}`)
  }

  const rng = createRng(seed)
  const ids = letters.map((letter) => letter.id)
  const rules = { letters, confusables, choiceCount }

  const questions = shuffle(ids, rng)
    .slice(0, questionCount)
    .map((target) => {
      const choices = [target]
      for (const candidate of shuffle(ids, rng)) {
        if (choices.length === choiceCount) break
        if (choices.includes(candidate)) continue
        if (choices.some((choice) => areConfusable(choice, candidate, confusables))) continue
        choices.push(candidate)
      }

      const question = { target, choices: shuffle(choices, rng) }
      const problems = findQuestionProblems(question, rules)
      if (problems.length > 0) {
        throw new Error(`Invalid question for "${target}" (seed ${seed}): ${problems.join('; ')}`)
      }
      return question
    })

  return { seed, questions }
}

export function areConfusable(a: string, b: string, groups: readonly ConfusableGroup[]): boolean {
  return groups.some((group) => group.ids.includes(a) && group.ids.includes(b))
}

/** Every rule a question must pass before it is shown. Returns the problems in plain words. */
export function findQuestionProblems(question: FindLetterQuestion, rules: RoundRules): string[] {
  const problems: string[] = []
  const { choices, target } = question
  const known = new Set(rules.letters.map((letter) => letter.id))

  if (choices.length !== rules.choiceCount) {
    problems.push(`expected ${rules.choiceCount} choices, got ${choices.length}`)
  }
  if (choices.filter((choice) => choice === target).length !== 1) {
    problems.push('the answer must appear exactly once')
  }
  if (new Set(choices).size !== choices.length) {
    problems.push('choices must be different letters')
  }
  for (const choice of choices) {
    if (!known.has(choice)) problems.push(`unknown letter "${choice}"`)
  }
  choices.forEach((a, i) => {
    for (const b of choices.slice(i + 1)) {
      if (areConfusable(a, b, rules.confusables)) problems.push(`"${a}" and "${b}" are easy to mix up`)
    }
  })
  return problems
}
