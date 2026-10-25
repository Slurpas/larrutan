import { chanceCorrected } from '../levels'
import type { SpellingQuestion, SpellingRound } from './createRound'

/**
 * Where a Bygg ordet round is: how much of the word is built, which bubbles are used up,
 * and how much help to give. Pure, so the rules are tested without a screen.
 */
export interface SpellingState {
  round: SpellingRound
  questionIndex: number
  /** Letters of the word built so far. */
  built: number
  /** Bubbles popped into the word. */
  used: string[]
  /** Bubbles with a letter that is not in the word at all: tapped, greyed out, out of the game. */
  removed: string[]
  /** Wrong taps since the last right one: 1 lights up the next slot, 2 also the right bubble. */
  wrongInStep: number
  /** Wrong taps in this word, and in the whole round (never reduces a reward). */
  wrongInWord: number
  wrongTaps: number
  /** For each finished word: built without a single wrong tap? Feeds mastery. */
  firstTry: boolean[]
  /** The chance that a tap on any bubble in play was right, when the letter needed now was first looked for. */
  stepChance: number
  /** Letters placed so far in the round; how many on the first tap; the chance of that by guessing, added up. */
  steps: number
  stepsFirstTry: number
  stepsChance: number
  phase: 'building' | 'built' | 'finished'
}

export type TapResult = 'right' | 'wrong-letter' | 'not-yet' | 'ignored'

export function startSpelling(round: SpellingRound): SpellingState {
  return {
    round,
    questionIndex: 0,
    built: 0,
    used: [],
    removed: [],
    wrongInStep: 0,
    wrongInWord: 0,
    wrongTaps: 0,
    firstTry: [],
    stepChance: guessChance(round.questions[0], 0, [], []),
    steps: 0,
    stepsFirstTry: 0,
    stepsChance: 0,
    phase: 'building',
  }
}

export function currentWord(state: SpellingState): SpellingQuestion | undefined {
  return state.round.questions[state.questionIndex]
}

/** The chance that tapping any bubble in play gives the letter needed next (two L bubbles in "nalle" both do). */
function guessChance(question: SpellingQuestion | undefined, built: number, used: readonly string[], removed: readonly string[]): number {
  if (!question) return 0
  const open = question.bubbles.filter((b) => !used.includes(b.id) && !removed.includes(b.id))
  return open.filter((b) => b.letter === question.letters[built]).length / Math.max(1, open.length)
}

/** The letter the word needs next, if any. */
export function nextLetter(state: SpellingState): string | undefined {
  return currentWord(state)?.letters[state.built]
}

/**
 * A tap on a bubble. Right: the next letter of the word (any bubble with it). Wrong letter:
 * not in the word at all, so it greys out. Not yet: a letter of the word, but a later one;
 * it stays, since it will be needed.
 */
export function tapBubble(state: SpellingState, bubbleId: string): { state: SpellingState; result: TapResult } {
  const question = currentWord(state)
  const bubble = question?.bubbles.find((b) => b.id === bubbleId)
  if (state.phase !== 'building' || !question || !bubble || state.used.includes(bubbleId) || state.removed.includes(bubbleId)) {
    return { state, result: 'ignored' }
  }
  if (bubble.letter === nextLetter(state)) {
    const built = state.built + 1
    const done = built === question.letters.length
    const used = [...state.used, bubbleId]
    return {
      state: {
        ...state,
        built,
        used,
        wrongInStep: 0,
        phase: done ? 'built' : 'building',
        firstTry: done ? [...state.firstTry, state.wrongInWord === 0] : state.firstTry,
        stepChance: guessChance(question, built, used, state.removed),
        steps: state.steps + 1,
        stepsFirstTry: state.stepsFirstTry + (state.wrongInStep === 0 ? 1 : 0),
        stepsChance: state.stepsChance + state.stepChance,
      },
      result: 'right',
    }
  }
  const stillNeeded = question.letters.slice(state.built).includes(bubble.letter)
  return {
    state: {
      ...state,
      removed: stillNeeded ? state.removed : [...state.removed, bubbleId],
      wrongInStep: state.wrongInStep + 1,
      wrongInWord: state.wrongInWord + 1,
      wrongTaps: state.wrongTaps + 1,
    },
    result: stillNeeded ? 'not-yet' : 'wrong-letter',
  }
}

/** On to the next word, after the built one has been celebrated. */
export function nextWord(state: SpellingState): SpellingState {
  if (state.phase !== 'built') return state
  const questionIndex = state.questionIndex + 1
  const finished = questionIndex >= state.round.questions.length
  return {
    ...state,
    questionIndex,
    built: 0,
    used: [],
    removed: [],
    wrongInStep: 0,
    wrongInWord: 0,
    stepChance: guessChance(state.round.questions[questionIndex], 0, [], []),
    phase: finished ? 'finished' : 'building',
  }
}

/** How well the round went, from 0 to 1: letters found on the first tap, compared with tapping any bubble. */
export function spellingScore(state: SpellingState): number {
  if (state.steps === 0) return 1
  return chanceCorrected(state.stepsFirstTry / state.steps, state.stepsChance / state.steps)
}

/** The bubble to point at when the child is stuck (after two wrong taps in a row). */
export function hintBubble(state: SpellingState): string | undefined {
  if (state.wrongInStep < 2) return undefined
  const letter = nextLetter(state)
  return currentWord(state)?.bubbles.find((b) => b.letter === letter && !state.used.includes(b.id))?.id
}
