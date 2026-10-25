import type { Word } from '../../content/words'
import { couldBeMistaken } from '../../content/words'
import {
  assertNoProblems,
  choicePairs,
  findChoiceProblems,
  pickChoices,
  type ChoiceQuestion,
  type ChoiceRound,
} from '../choiceQuestion'
import { practiceOrder } from '../../learning/mastery'
import { createRng } from '../random'

interface WordPictureRules {
  words: readonly Word[]
  choiceCount: number
}

export interface WordPictureOptions extends Omit<WordPictureRules, 'choiceCount'> {
  seed: number
  questionCount?: number
  choiceCount?: number
  /** The words it may ask about (all of them unless given): when the child reads, only short ones. */
  targets?: readonly Word[]
  /** Mastery box per word id: words still being learned come up more often (src/learning). */
  practiceBox?: (word: string) => number
}

/**
 * Ord och bild: hear "Var är solen?" and tap the picture. Choices are word ids.
 * No two pictures in a question could be called by the same name.
 */
export function createWordPictureRound({
  seed,
  words,
  questionCount = 5,
  choiceCount = 3,
  targets = words,
  practiceBox = () => 1,
}: WordPictureOptions): ChoiceRound {
  if (questionCount > targets.length) {
    throw new Error(`A round of ${questionCount} needs at least that many words, got ${targets.length}`)
  }

  const rng = createRng(seed)
  const ids = words.map((word) => word.id)
  const byId = new Map(words.map((word) => [word.id, word]))
  const rules = { words, choiceCount }

  const questions = practiceOrder(
    targets.map((word) => word.id),
    practiceBox,
    rng,
  )
    .slice(0, questionCount)
    .map((target) => {
      const choices = pickChoices(target, ids, choiceCount, rng, (candidate, chosen) =>
        chosen.every((choice) => !couldBeMistaken(byId.get(choice)!, byId.get(candidate)!)),
      )
      const question = { target, choices }
      assertNoProblems(findWordPictureProblems(question, rules), `"${target}" (seed ${seed})`)
      return question
    })

  return { seed, questions }
}

export function findWordPictureProblems(question: ChoiceQuestion, rules: WordPictureRules): string[] {
  const byId = new Map(rules.words.map((word) => [word.id, word]))
  const problems = findChoiceProblems(question, rules.choiceCount, new Set(byId.keys()))
  for (const [a, b] of choicePairs(question.choices)) {
    const wordA = byId.get(a)
    const wordB = byId.get(b)
    if (wordA && wordB && couldBeMistaken(wordA, wordB)) {
      problems.push(`"${wordA.base}" and "${wordB.base}" could be mistaken for each other`)
    }
  }
  return problems
}
