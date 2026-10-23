import { areConfusable, lookAlikesOf, type ConfusableGroup } from '../content/letters'
import { choicePairs, pickChoices } from './choiceQuestion'
import type { Difficulty } from './difficulty'
import { practiceOrder } from '../learning/mastery'
import { shuffle, type Rng } from './random'

interface LetterChoiceOptions {
  target: string
  /** Letter ids that may be offered. */
  pool: readonly string[]
  count: number
  rng: Rng
  confusables: readonly ConfusableGroup[]
  difficulty: Difficulty
}

/**
 * Letter choices for a question (Hitta bokstaven, Första bokstaven).
 * Easy: no two choices look or sound alike. Hard: the answer's look-alikes are
 * among the choices (A with Å and Ä, O with Ö), so the child must look closely.
 */
export function pickLetterChoices({ target, pool, count, rng, confusables, difficulty }: LetterChoiceOptions): string[] {
  if (difficulty === 'easy') {
    return pickChoices(target, pool, count, rng, (candidate, chosen) =>
      chosen.every((choice) => !areConfusable(choice, candidate, confusables)),
    )
  }

  // Leave room for at least one letter that looks nothing like the answer.
  const lookAlikes = shuffle(
    lookAlikesOf(target, confusables).filter((id) => pool.includes(id)),
    rng,
  ).slice(0, Math.max(1, count - 2))
  const choices = [target, ...lookAlikes]
  for (const candidate of shuffle(pool, rng)) {
    if (choices.length === count) break
    if (choices.includes(candidate) || areConfusable(candidate, target, confusables)) continue
    choices.push(candidate)
  }
  return shuffle(choices, rng)
}

/** Letters the hard level should ask about first: the ones that have look-alikes (weaker ones first within each group). */
export function hardTargetsFirst(
  ids: readonly string[],
  confusables: readonly ConfusableGroup[],
  rng: Rng,
  box: (id: string) => number = () => 1,
): string[] {
  const tricky = ids.filter((id) => lookAlikesOf(id, confusables).length > 0)
  const plain = ids.filter((id) => !tricky.includes(id))
  return [...practiceOrder(tricky, box, rng), ...practiceOrder(plain, box, rng)]
}

/** The look-alike rules for each difficulty, as problems in plain words. */
export function findLookAlikeProblems(
  target: string,
  choices: readonly string[],
  confusables: readonly ConfusableGroup[],
  difficulty: Difficulty,
): string[] {
  if (difficulty === 'easy') {
    return choicePairs(choices)
      .filter(([a, b]) => areConfusable(a, b, confusables))
      .map(([a, b]) => `"${a}" and "${b}" are easy to mix up`)
  }
  const hasLookAlikes = lookAlikesOf(target, confusables).length > 0
  const found = choices.filter((id) => id !== target && areConfusable(id, target, confusables)).length
  if (hasLookAlikes && found === 0) return [`hard level needs a look-alike of "${target}"`]
  if (found >= choices.length - 1) return [`hard level needs a letter that looks nothing like "${target}"`]
  return []
}
