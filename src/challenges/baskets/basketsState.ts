import { chanceCorrected } from '../levels'
import type { BasketsRound } from './createRound'

/**
 * Where a Bokstavskorgarna round is: the piles, what each basket holds, and which pictures
 * the child has seen. Pure, so the rules are tested without a screen. The top picture of a
 * pile may go in the basket of the letter its word starts with, and nowhere else.
 */
export interface BasketsState {
  round: BasketsRound
  /** Each pile's pictures, bottom first. */
  piles: string[][]
  /** What each basket holds, by its letter's id. */
  baskets: Readonly<Record<string, readonly string[]>>
  /** Pictures that have been face up: the top ones from the start (all if none are hidden), and every one uncovered since. */
  seen: string[]
  /** Pictures put in a basket, and how many went in the right one. */
  drops: number
  dropHits: number
  /** Pictures once put in the wrong basket (mastery: not known on the first try). */
  slipped: string[]
}

export type DropResult = 'right' | 'wrong' | 'ignored'

export function startBaskets(round: BasketsRound, hidden: boolean): BasketsState {
  const seen = hidden ? round.piles.flatMap((pile) => pile.slice(-1)) : round.piles.flat()
  const baskets = Object.fromEntries(round.sets.map((set) => [set, []]))
  return { round, piles: round.piles.map((pile) => [...pile]), baskets, seen, drops: 0, dropHits: 0, slipped: [] }
}

/** Puts the top picture of `pile` in the basket of letter `set`; in the wrong basket it stays where it was. */
export function dropInBasket(state: BasketsState, pile: number, set: string): { state: BasketsState; result: DropResult } {
  const card = state.piles[pile]?.at(-1)
  if (!card || !state.round.sets.includes(set)) return { state, result: 'ignored' }
  const counted = { ...state, drops: state.drops + 1 }
  if (state.round.cards[card]?.set !== set) {
    return { state: { ...counted, slipped: state.slipped.includes(card) ? state.slipped : [...state.slipped, card] }, result: 'wrong' }
  }
  const piles = state.piles.map((cards, i) => (i === pile ? cards.slice(0, -1) : cards))
  const uncovered = piles[pile]!.at(-1)
  const seen = uncovered === undefined || state.seen.includes(uncovered) ? state.seen : [...state.seen, uncovered]
  return {
    state: { ...counted, dropHits: state.dropHits + 1, piles, seen, baskets: { ...state.baskets, [set]: [...state.baskets[set]!, card] } },
    result: 'right',
  }
}

/** A basket with every picture of its letter in it. */
export function isBasketFull(state: BasketsState, set: string): boolean {
  return (state.baskets[set]?.length ?? 0) === Object.values(state.round.cards).filter((card) => card.set === set).length
}

export function isFinished(state: BasketsState): boolean {
  return state.piles.every((pile) => pile.length === 0)
}

/** How well it went, from 0 to 1: pictures put in the right basket the first time, compared with picking a basket at random. */
export function basketsScore(state: BasketsState): number {
  if (state.drops === 0) return 1
  return chanceCorrected(state.dropHits / state.drops, 1 / state.round.sets.length)
}
