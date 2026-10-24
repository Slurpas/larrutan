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
  phase: 'building' | 'built' | 'finished'
}

export type TapResult = 'right' | 'wrong-letter' | 'not-yet' | 'ignored'

export function startSpelling(round: SpellingRound): SpellingState {
  return { round, questionIndex: 0, built: 0, used: [], removed: [], wrongInStep: 0, wrongInWord: 0, wrongTaps: 0, firstTry: [], phase: 'building' }
}

export function currentWord(state: SpellingState): SpellingQuestion | undefined {
  return state.round.questions[state.questionIndex]
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
    return {
      state: {
        ...state,
        built,
        used: [...state.used, bubbleId],
        wrongInStep: 0,
        phase: done ? 'built' : 'building',
        firstTry: done ? [...state.firstTry, state.wrongInWord === 0] : state.firstTry,
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
  return { ...state, questionIndex, built: 0, used: [], removed: [], wrongInStep: 0, wrongInWord: 0, phase: finished ? 'finished' : 'building' }
}

/** The bubble to point at when the child is stuck (after two wrong taps in a row). */
export function hintBubble(state: SpellingState): string | undefined {
  if (state.wrongInStep < 2) return undefined
  const letter = nextLetter(state)
  return currentWord(state)?.bubbles.find((b) => b.letter === letter && !state.used.includes(b.id))?.id
}
