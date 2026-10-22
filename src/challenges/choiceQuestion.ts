import { shuffle, type Rng } from './random'

/** A question where the child taps one of a few choices. All three challenges use this shape. */
export interface ChoiceQuestion {
  /** Id of the right answer. */
  target: string
  /** Ids in display order; contains the target exactly once. */
  choices: string[]
}

export interface ChoiceRound<Q extends ChoiceQuestion = ChoiceQuestion> {
  seed: number
  questions: Q[]
}

/**
 * The target plus distractors from the pool, in random order. A candidate is
 * only added if `fits` accepts it next to the choices picked so far.
 */
export function pickChoices(
  target: string,
  pool: readonly string[],
  count: number,
  rng: Rng,
  fits: (candidate: string, chosen: readonly string[]) => boolean,
): string[] {
  const choices = [target]
  for (const candidate of shuffle(pool, rng)) {
    if (choices.length === count) break
    if (!choices.includes(candidate) && fits(candidate, choices)) choices.push(candidate)
  }
  return shuffle(choices, rng)
}

/** Rules every choice question must pass, whatever the challenge. Returns problems in plain words. */
export function findChoiceProblems(question: ChoiceQuestion, choiceCount: number, known: ReadonlySet<string>): string[] {
  const problems: string[] = []
  const { choices, target } = question

  if (choices.length !== choiceCount) problems.push(`expected ${choiceCount} choices, got ${choices.length}`)
  if (choices.filter((choice) => choice === target).length !== 1) problems.push('the answer must appear exactly once')
  if (new Set(choices).size !== choices.length) problems.push('choices must be different')
  for (const choice of choices) {
    if (!known.has(choice)) problems.push(`unknown choice "${choice}"`)
  }
  return problems
}

/** Each pair of choices once, for pairwise rules such as "these two look alike". */
export function choicePairs(choices: readonly string[]): [string, string][] {
  return choices.flatMap((a, i) => choices.slice(i + 1).map((b): [string, string] => [a, b]))
}

/** A broken question must never reach the child; fail loudly instead. */
export function assertNoProblems(problems: readonly string[], context: string): void {
  if (problems.length > 0) throw new Error(`Invalid question for ${context}: ${problems.join('; ')}`)
}
