import { chanceCorrected, firstTryScore } from '../levels'
import type { AppleQuestion, AppleRound } from './createRound'

/**
 * Where an Äppelträdet round is. Pure, so the rules are tested without a screen. An apple is
 * known by its tree spot (src/art/appleTree.ts), or in 'basket' by its place in the basket.
 *   picking  apples to pick from the tree ('pick', 'make')
 *   asking   "Hur många?": the tree is empty ('pick'), or from the start ('basket')
 *   correct  the right answer, celebrated before the next question
 */
export interface AppleState {
  round: AppleRound
  questionIndex: number
  /** The apples in the basket, in the order they came: two rows of five. */
  basket: number[]
  phase: 'picking' | 'asking' | 'correct' | 'finished'
  /** Wrong numbers tapped for this question; they stay, greyed out. */
  removed: string[]
  /** Apples that show their number, in counting order: touched by the child, or all of them when the basket counts itself. */
  counted: number[]
  /** Taps on the tick with too many or too few apples ('make'). */
  misses: number
  /** For each answered question: right on the first try? */
  firstTry: boolean[]
}

function atQuestion(round: AppleRound, questionIndex: number, firstTry: boolean[]): AppleState {
  const question = round.questions[questionIndex]
  const finished = !question
  const inBasket = question && round.mode === 'basket' ? Array.from({ length: question.count }, (_, i) => i) : []
  const phase = finished ? 'finished' : round.mode === 'basket' ? 'asking' : 'picking'
  return { round, questionIndex, basket: inBasket, phase, removed: [], counted: [], misses: 0, firstTry }
}

export function startApples(round: AppleRound): AppleState {
  return atQuestion(round, 0, [])
}

export function currentQuestion(state: AppleState): AppleQuestion | undefined {
  return state.round.questions[state.questionIndex]
}

/** The apples still on the tree. */
export function onTree(state: AppleState): number[] {
  return (currentQuestion(state)?.spots ?? []).filter((spot) => !state.basket.includes(spot))
}

/** An apple tapped on the tree drops into the basket. In 'pick' the question comes once the tree is empty. */
export function pickApple(state: AppleState, spot: number): AppleState {
  if (state.phase !== 'picking' || !onTree(state).includes(spot)) return state
  const basket = [...state.basket, spot]
  const empty = state.round.mode === 'pick' && basket.length === currentQuestion(state)!.spots.length
  return { ...state, basket, counted: [], phase: empty ? 'asking' : 'picking' }
}

/** 'make': an apple tapped in the basket goes back up on the tree. */
export function putBack(state: AppleState, spot: number): AppleState {
  if (state.phase !== 'picking' || state.round.mode !== 'make' || !state.basket.includes(spot)) return state
  return { ...state, basket: state.basket.filter((s) => s !== spot), counted: [] }
}

/** While the question is asked, touching an apple in the basket gives it the next number (help the child can take). */
export function touchApple(state: AppleState, apple: number): AppleState {
  if (state.phase !== 'asking' || !state.basket.includes(apple) || state.counted.includes(apple)) return state
  return { ...state, counted: [...state.counted, apple] }
}

/** Help: every apple in the basket gets its number, in the order they lie. */
export function countAll(state: AppleState): AppleState {
  return { ...state, counted: [...state.basket] }
}

/** A tapped number: right ends the question; wrong is greyed out. */
export function chooseNumber(state: AppleState, choice: string): { state: AppleState; result: 'right' | 'wrong' | 'ignored' } {
  const question = currentQuestion(state)
  if (state.phase !== 'asking' || !question || !question.choices.includes(choice) || state.removed.includes(choice)) return { state, result: 'ignored' }
  if (choice === question.target) return { state: { ...state, phase: 'correct', firstTry: [...state.firstTry, state.removed.length === 0] }, result: 'right' }
  return { state: { ...state, removed: [...state.removed, choice] }, result: 'wrong' }
}

/** 'make': the tick. Exactly as many as asked for is right; an empty basket is a slip of the finger and ignored. */
export function finishPicking(state: AppleState): { state: AppleState; result: 'right' | 'tooMany' | 'tooFew' | 'ignored' } {
  const question = currentQuestion(state)
  if (state.phase !== 'picking' || state.round.mode !== 'make' || !question || state.basket.length === 0) return { state, result: 'ignored' }
  if (state.basket.length === question.count) return { state: { ...state, phase: 'correct', firstTry: [...state.firstTry, state.misses === 0] }, result: 'right' }
  return { state: { ...state, misses: state.misses + 1 }, result: state.basket.length > question.count ? 'tooMany' : 'tooFew' }
}

/** On to the next tree after the praise for a right answer. */
export function nextQuestion(state: AppleState): AppleState {
  if (state.phase !== 'correct') return state
  return atQuestion(state.round, state.questionIndex + 1, state.firstTry)
}

/** Only the answer is left untapped. */
export function isRevealed(state: AppleState): boolean {
  const question = currentQuestion(state)
  return state.phase === 'asking' && !!question && question.choices.every((choice) => choice === question.target || state.removed.includes(choice))
}

/** Right on the first try, with guessing taken out; picking the right amount can't be guessed. */
export function appleScore(state: AppleState): number {
  const { questions, mode } = state.round
  if (mode === 'make') return chanceCorrected(state.firstTry.filter(Boolean).length / Math.max(1, questions.length), 0)
  return firstTryScore(
    state.firstTry,
    questions.map((q) => q.choices.length),
  )
}
