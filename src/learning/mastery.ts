import type { ChallengeId } from '../challenges/challengeIds'
import { shuffle, type Rng } from '../challenges/random'

/**
 * Mastery per letter and word (PRD §6), as Leitner boxes from 1 (still learning)
 * to 5 (known well). Right on the first try moves an item up one box; needing a
 * second try moves it down one. Gentle and reversible: one slip never sends an
 * item back to the start, and nothing about it is ever shown to the child.
 */
export const lowestBox = 1
export const highestBox = 5

/** Box per practice key ("findLetter:A", "firstLetter:sun"). Items never practised are in box 1. */
export type Mastery = Readonly<Record<string, number>>

/** One question of a finished round: what was practised, and whether the first tap was right. */
export interface Practiced {
  item: string
  firstTry: boolean
}

/** Each challenge practises its own skill, so knowing "A" by sight says nothing about "sol" starting with S. */
export function practiceKey(challenge: ChallengeId, item: string): string {
  return `${challenge}:${item}`
}

export function boxOf(mastery: Mastery, key: string): number {
  return mastery[key] ?? lowestBox
}

export function recordPractice(mastery: Mastery, challenge: ChallengeId, practiced: readonly Practiced[]): Mastery {
  const next = { ...mastery }
  for (const { item, firstTry } of practiced) {
    const key = practiceKey(challenge, item)
    const box = boxOf(next, key) + (firstTry ? 1 : -1)
    next[key] = Math.min(highestBox, Math.max(lowestBox, box))
  }
  return next
}

/**
 * How likely an item is to come up, by box: each box comes back about half as
 * often as the one below, so items still being learned come up most, while known
 * ones still come back now and then (they never disappear).
 */
const weightByBox: Record<number, number> = { 1: 8, 2: 4, 3: 2, 4: 1, 5: 0.5 }

/**
 * A random order for a round, weaker items first more often. When every item is
 * in the same box (always, for a new player) it is exactly the plain shuffle, so
 * seeded rounds stay the same as before mastery existed.
 */
export function practiceOrder<T>(items: readonly T[], box: (item: T) => number, rng: Rng): T[] {
  const boxes = items.map(box)
  if (boxes.every((b) => b === boxes[0])) return shuffle(items, rng)
  // Weighted random order without replacement (Efraimidis–Spirakis): sort by u^(1/weight).
  return items
    .map((item, i) => ({ item, key: rng() ** (1 / (weightByBox[boxes[i] ?? lowestBox] ?? 1)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ item }) => item)
}
