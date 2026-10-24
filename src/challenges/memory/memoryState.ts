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
}

export type TurnResult = 'turned' | 'match' | 'mismatch' | 'ignored'

export function startMemory(round: MemoryRound): MemoryState {
  return { round, open: [], matched: [], seen: [], slips: 0, slipped: [] }
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

  if (first.pair === card.pair) {
    return { state: { ...state, open: [], seen, matched: [...state.matched, first.id, card.id] }, result: 'match' }
  }
  const partner = state.round.cards.find((c) => c.pair === first.pair && c.id !== first.id)
  const slip = partner !== undefined && state.seen.includes(partner.id)
  return {
    state: {
      ...state,
      open: [first.id, cardId],
      seen,
      slips: state.slips + (slip ? 1 : 0),
      slipped: slip && !state.slipped.includes(first.pair) ? [...state.slipped, first.pair] : state.slipped,
    },
    result: 'mismatch',
  }
}

/** Two cards that didn't match turn back. */
export function closeCards(state: MemoryState): MemoryState {
  return state.open.length === 2 ? { ...state, open: [] } : state
}
