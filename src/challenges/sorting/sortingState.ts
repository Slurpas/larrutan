import { chanceCorrected } from '../levels'
import type { SortingRound } from './createRound'

/**
 * Where a Sortera korten round is: the piles, and which cards the child has seen. Pure, so
 * the rules are tested without a screen. A top card may go onto an empty pile, or onto a
 * pile whose top card belongs to the same letter.
 */
export interface SortingState {
  round: SortingRound
  /** Each pile's cards, bottom first. */
  piles: string[][]
  /** Cards that have been face up: the top cards from the start (all cards if none are hidden), every one uncovered since, and every card of a finished pile. */
  seen: string[]
  /** Moves onto a pile with cards: how many, how many were allowed, and the chance of that by guessing, added up. */
  drops: number
  dropHits: number
  dropChance: number
  /** Cards once put on a pile of another letter (mastery: not known on the first try). */
  slipped: string[]
}

export type MoveResult = 'moved' | 'wrong' | 'ignored'

export function startSorting(round: SortingRound, hidden: boolean): SortingState {
  const seen = hidden ? round.piles.flatMap((pile) => pile.slice(-1)) : round.piles.flat()
  return { round, piles: round.piles.map((pile) => [...pile]), seen, drops: 0, dropHits: 0, dropChance: 0, slipped: [] }
}

export function setOf(state: SortingState, cardId: string): string {
  return state.round.cards[cardId]?.set ?? ''
}

function setSize(state: SortingState, set: string): number {
  return Object.values(state.round.cards).filter((card) => card.set === set).length
}

/** May the top card of `from` go onto pile `to`? */
export function canMove(state: SortingState, from: number, to: number): boolean {
  const card = state.piles[from]?.at(-1)
  const target = state.piles[to]
  if (!card || !target || from === to) return false
  const top = target.at(-1)
  return top === undefined || setOf(state, top) === setOf(state, card)
}

/** Moves the top card of `from` onto `to`; a move the rules don't allow is 'wrong', and nothing moves. */
export function moveCard(state: SortingState, from: number, to: number): { state: SortingState; result: MoveResult } {
  const card = state.piles[from]?.at(-1)
  const target = state.piles[to]
  if (!card || !target || from === to) return { state, result: 'ignored' }
  // Onto a pile with cards: was it right, and how likely by guessing (among the other piles with cards)?
  const scored = target.length > 0
  const others = state.piles.filter((pile, i) => i !== from && pile.length > 0)
  const chance = others.length === 0 ? 0 : others.filter((pile) => setOf(state, pile.at(-1)!) === setOf(state, card)).length / others.length
  const tally = (hit: boolean) =>
    scored ? { drops: state.drops + 1, dropHits: state.dropHits + (hit ? 1 : 0), dropChance: state.dropChance + chance } : {}

  if (!canMove(state, from, to)) {
    return {
      state: { ...state, ...tally(false), slipped: state.slipped.includes(card) ? state.slipped : [...state.slipped, card] },
      result: 'wrong',
    }
  }
  const piles = state.piles.map((pile, i) => (i === from ? pile.slice(0, -1) : i === to ? [...pile, card] : pile))
  const moved = { ...state, ...tally(true), piles }
  // The card underneath turns face up, and so does every card of a pile just finished (a letter never uncovered, too).
  const shown = [...piles[from]!.slice(-1), ...piles.flatMap((pile, i) => (isSetDone(moved, i) ? pile : []))]
  const seen = [...state.seen, ...new Set(shown.filter((id) => !state.seen.includes(id)))]
  return { state: { ...moved, seen }, result: 'moved' }
}

/** A pile holding every card of one letter, and nothing else. */
export function isSetDone(state: SortingState, pile: number): boolean {
  const cards = state.piles[pile] ?? []
  const first = cards[0]
  if (first === undefined) return false
  const set = setOf(state, first)
  return cards.every((card) => setOf(state, card) === set) && cards.length === setSize(state, set)
}

export function isFinished(state: SortingState): boolean {
  return state.round.sets.every((set) => state.piles.some((pile, i) => pile.length > 0 && setOf(state, pile[0]!) === set && isSetDone(state, i)))
}

/**
 * The letter a pile is labelled with: its bottom card is a letter the child has seen, and
 * every card on it belongs to that letter. Once found, the letter stays in sight, even
 * under its pictures (the user's idea).
 */
export function pileLetter(state: SortingState, pile: number): string | undefined {
  const cards = state.piles[pile] ?? []
  const bottom = cards[0] === undefined ? undefined : state.round.cards[cards[0]]
  if (bottom?.kind !== 'letter' || !state.seen.includes(bottom.id)) return undefined
  return cards.every((card) => setOf(state, card) === bottom.set) ? bottom.set : undefined
}

/** How well it went, from 0 to 1: moves onto a pile allowed the first time, compared with picking a pile at random. */
export function sortingScore(state: SortingState): number {
  if (state.drops === 0) return 1
  return chanceCorrected(state.dropHits / state.drops, state.dropChance / state.drops)
}

/**
 * A way to sort the round, move by move ([from, to]), knowing every card: first onto a pile
 * of the card's letter that holds nothing else, then into an empty pile, then onto a top
 * card of its letter, from the shorter run of that letter to the longer (so cards never go
 * back and forth). Used by the tests (every deal can be sorted) and the browser tests.
 */
export function solve(round: SortingRound, limit = 400): [number, number][] {
  let state = startSorting(round, false)
  const moves: [number, number][] = []
  const clean = (pile: string[]) => pile.length > 0 && pile.every((card) => setOf(state, card) === setOf(state, pile[0]!))
  const piles = () => state.piles.map((pile, i) => ({ pile, i }))
  /** How many cards of the top card's letter lie on top of each other. */
  const run = (pile: string[]) => {
    let count = 0
    while (count < pile.length && setOf(state, pile[pile.length - 1 - count]!) === setOf(state, pile.at(-1)!)) count++
    return count
  }
  while (!isFinished(state) && moves.length < limit) {
    const mixed = piles().filter(({ pile }) => pile.length > 0 && !clean(pile))
    const sameSet = (from: number, to: number) => {
      const top = state.piles[to]!.at(-1)
      return top !== undefined && setOf(state, top) === setOf(state, state.piles[from]!.at(-1)!)
    }
    const move =
      // A card from a mixed pile onto a pile of its letter that holds nothing else.
      mixed.flatMap(({ i: from }) => piles().filter(({ pile, i }) => i !== from && clean(pile) && sameSet(from, i)).map(({ i }) => [from, i] as [number, number]))[0] ??
      // Two piles of one letter, each holding nothing else: the smaller onto the larger.
      piles()
        .filter(({ pile }) => clean(pile))
        .flatMap(({ pile, i: from }) =>
          piles()
            .filter(({ pile: other, i }) => i !== from && clean(other) && sameSet(from, i) && other.length >= pile.length)
            .map(({ i }) => [from, i] as [number, number]),
        )[0] ??
      // A card from a mixed pile into an empty one.
      mixed.flatMap(({ i: from }) => piles().filter(({ pile }) => pile.length === 0).map(({ i }) => [from, i] as [number, number]))[0] ??
      // Onto a top card of its own letter, from the shorter run of that letter to the longer.
      mixed.flatMap(({ pile, i: from }) =>
        piles()
          .filter(({ pile: other, i }) => i !== from && sameSet(from, i) && (run(other) > run(pile) || (run(other) === run(pile) && i < from)))
          .map(({ i }) => [from, i] as [number, number]),
      )[0]
    if (!move) break
    state = moveCard(state, move[0], move[1]).state
    moves.push(move)
  }
  return isFinished(state) ? moves : []
}
