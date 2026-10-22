import type { FindLetterQuestion, FindLetterRound } from './createRound'

export interface FindLetterState {
  round: FindLetterRound
  questionIndex: number
  /** Wrong choices tapped in this question. They stay in place, greyed out, so nothing moves. */
  removed: string[]
  phase: 'asking' | 'correct' | 'finished'
}

export function startFindLetter(round: FindLetterRound): FindLetterState {
  return { round, questionIndex: 0, removed: [], phase: 'asking' }
}

export function currentQuestion(state: FindLetterState): FindLetterQuestion | undefined {
  return state.round.questions[state.questionIndex]
}

/** A tap on a choice. Wrong taps grey out that choice; nothing is ever lost for being wrong. */
export function choose(state: FindLetterState, choice: string): FindLetterState {
  const question = currentQuestion(state)
  if (state.phase !== 'asking' || !question) return state
  if (!question.choices.includes(choice) || state.removed.includes(choice)) return state

  if (choice === question.target) return { ...state, phase: 'correct' }
  return { ...state, removed: [...state.removed, choice] }
}

/** Moves on after the praise for a correct answer. */
export function advance(state: FindLetterState): FindLetterState {
  if (state.phase !== 'correct') return state
  const questionIndex = state.questionIndex + 1
  const finished = questionIndex >= state.round.questions.length
  return { ...state, questionIndex, removed: [], phase: finished ? 'finished' : 'asking' }
}

/** True once every wrong choice has been tapped, so only the answer is left. */
export function isAnswerRevealed(state: FindLetterState): boolean {
  const question = currentQuestion(state)
  if (!question) return false
  return question.choices.every((choice) => choice === question.target || state.removed.includes(choice))
}
