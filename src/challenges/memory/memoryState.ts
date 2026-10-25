import { chanceCorrected } from '../levels'
import type { MemoryCard, MemoryRound } from './createRound'

/**
 * Where a Memory round is: which cards are face up, which pairs are found, and the
 * child's slips. Pure, so the rules are tested without a screen.
 */
export interface MemoryState {
  round: MemoryRound
  /** Face up but not found yet: one card, or two that don't match (until they turn back). */
  open: string[]
  /** Cards of the pairs found; they stay face up. */
  matched: string[]
  /** Every card the child has seen face up. */
  seen: string[]
  /**
   * Two cards that didn't match although the first one's partner had been seen before.
   * Turning an unknown card is exploring, not a slip; slips decide the level, never a reward.
   */
  slips: number
  /** Pairs with a slip; a pair found without one counts as known (mastery). */
  slipped: string[]
  /** Second cards turned when the first card's partner had been seen: the child could know where it was. */
  known: number
  /** …how many of those found the pair, */
  knownFound: number
  /** …and the chance of finding it by guessing, added up: 1 / the face-down cards it could have been. */
  knownChance: number
}

export type TurnResult = 'turned' | 'match' | 'mismatch' | 'ignored'

export function startMemory(round: MemoryRound): MemoryState {
  return { round, open: [], matched: [], seen: [], slips: 0, slipped: [], known: 0, knownFound: 0, knownChance: 0 }
}

function cardOf(state: MemoryState, id: string): MemoryCard | undefined {
  return state.round.cards.find((card) => card.id === id)
}

export function isFinished(state: MemoryState): boolean {
  return state.matched.length === state.round.cards.length
}

/**
 * A tap on a card. Two cards that didn't match turn back as soon as another one is
 * turned, so a tap is never lost while they are still showing.
 */
export function turnCard(state: MemoryState, cardId: string): { state: MemoryState; result: TurnResult } {
  const card = cardOf(state, cardId)
  if (!card || isFinished(state) || state.matched.includes(cardId) || state.open.includes(cardId)) return { state, result: 'ignored' }
  const open = state.open.length === 2 ? [] : state.open
  const seen = state.seen.includes(cardId) ? state.seen : [...state.seen, cardId]
  const first = open[0] === undefined ? undefined : cardOf(state, open[0])
  if (!first) return { state: { ...state, open: [cardId], seen }, result: 'turned' }

  // Did the child know where the partner was? Then this turn shows memory, not luck.
  const partner = state.round.cards.find((c) => c.pair === first.pair && c.id !== first.id)
  const partnerKnown = partner !== undefined && state.seen.includes(partner.id)
  const faceDown = state.round.cards.length - state.matched.length - 1
  const tally = partnerKnown
    ? { known: state.known + 1, knownChance: state.knownChance + 1 / faceDown, knownFound: state.knownFound + (first.pair === card.pair ? 1 : 0) }
    : {}
  if (first.pair === card.pair) {
    return { state: { ...state, ...tally, open: [], seen, matched: [...state.matched, first.id, card.id] }, result: 'match' }
  }
  return {
    state: {
      ...state,
      ...tally,
      open: [first.id, cardId],
      seen,
      slips: state.slips + (partnerKnown ? 1 : 0),
      slipped: partnerKnown && !state.slipped.includes(first.pair) ? [...state.slipped, first.pair] : state.slipped,
    },
    result: 'mismatch',
  }
}

/**
 * How well the child remembered, from 0 to 1: of the turns where they had seen the partner,
 * how many found it, compared with guessing. Turning unknown cards is exploring and doesn't
 * count; a board solved without ever needing to remember is flawless.
 */
export function memoryScore(state: MemoryState): number {
  if (state.known === 0) return 1
  return chanceCorrected(state.knownFound / state.known, state.knownChance / state.known)
}

/** Two cards that didn't match turn back. */
export function closeCards(state: MemoryState): MemoryState {
  return state.open.length === 2 ? { ...state, open: [] } : state
}
