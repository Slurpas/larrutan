import { phrases } from '../content/phrases'
import type { ChallengeId } from './challengeIds'

/**
 * The levels of every station (PRD §6): four each, easiest first. A level is what its round
 * is built with, and what is said the first time the child gets there (never when going
 * down). Which level a station opens at comes from how the last rounds there went
 * (`nextStation`). The user asked for more levels, scaling up for a child who keeps winning
 * and easing off for one who struggles, on 2026-10-25.
 */
export const levelCount = 4
export type Level = 1 | 2 | 3 | 4

/** Mata draken and Gruvvagnen: the letters to choose between. */
export interface LetterLevel {
  choices: number
  /** The answer's look-alikes among the choices (A with Å and Ä, O with Ö, M with N). */
  lookAlikes: boolean
  questions: number
}

/** Ord och bild: the word is said; said and written; or only written, so the child reads it. */
export interface WordPictureLevel {
  choices: number
  word: 'said' | 'said and written' | 'written'
}

export interface SpellingLevel {
  /** What of the word is shown faintly in the slots: all of it, all of it for a moment, every other letter for a moment, or nothing. */
  hint: 'word' | 'word briefly' | 'every other letter briefly' | 'none'
  extraLetters: number
  /** One extra letter looks like a letter of the word. */
  lookAlike: boolean
  /** Shortest and longest word, in letters. */
  lengths: readonly [number, number]
}

export interface MemoryLevel {
  pairs: number
  /** Two of the pairs' letters look alike. */
  lookAlikes: boolean
}

/** Sortera korten: piles to sort, each set a letter and pictures that start with it. */
export interface SortingLevel {
  sets: number
  /** The letter and its pictures. */
  cardsPerSet: number
  /** Only the top card of each pile is shown until it is uncovered. */
  hidden: boolean
  /** Two of the letters look alike. */
  lookAlikes: boolean
}

/** Bokstavskorgarna: a basket for each letter, and its pictures dealt into piles. */
export interface BasketsLevel {
  sets: number
  picturesPerSet: number
  piles: number
  /** Only the top picture of each pile is shown until it is uncovered. */
  hidden: boolean
  /** Two of the letters look alike. */
  lookAlikes: boolean
}

/** Räkna frukterna: two kinds of fruit to add up, and how much of the sum under them shows. */
export interface FruitLevel {
  /** The largest total. */
  maxSum: number
  choices: number
  /** All of it ("3 + 4 = 7", the child finds the 7), the parts ("3 + 4 = ?"), the first part ("3 + ? = ?"), or nothing. */
  shown: 'all' | 'parts' | 'first part' | 'nothing'
}

interface StationLevel<P> {
  params: P
  /** Said before the first round at this level. */
  intro?: string
}

type Levels<P> = readonly [StationLevel<P>, StationLevel<P>, StationLevel<P>, StationLevel<P>]

export const stationLevels = {
  findLetter: [
    { params: { choices: 3, lookAlikes: false, questions: 5 } },
    { params: { choices: 4, lookAlikes: false, questions: 5 }, intro: phrases.moreCookiesIntro },
    { params: { choices: 4, lookAlikes: true, questions: 5 }, intro: phrases.lookAlikesIntro },
    { params: { choices: 5, lookAlikes: true, questions: 5 }, intro: phrases.evenMoreCookiesIntro },
  ] satisfies Levels<LetterLevel>,
  firstLetter: [
    { params: { choices: 3, lookAlikes: false, questions: 5 } },
    { params: { choices: 4, lookAlikes: false, questions: 5 }, intro: phrases.fourTunnelsIntro },
    { params: { choices: 4, lookAlikes: true, questions: 5 }, intro: phrases.lookAlikesIntro },
    // The mine has room for four tunnels, so the last step is a longer ride.
    { params: { choices: 4, lookAlikes: true, questions: 7 }, intro: phrases.longerRideIntro },
  ] satisfies Levels<LetterLevel>,
  wordPicture: [
    { params: { choices: 3, word: 'said' } },
    { params: { choices: 4, word: 'said' }, intro: phrases.fourPicturesIntro },
    { params: { choices: 4, word: 'said and written' }, intro: phrases.writtenWordIntro },
    { params: { choices: 4, word: 'written' }, intro: phrases.readYourselfIntro },
  ] satisfies Levels<WordPictureLevel>,
  // The word fades out step by step (the user's idea, 2026-10-25): shown, shown for a moment,
  // every other letter for a moment, then not at all.
  spelling: [
    { params: { hint: 'word', extraLetters: 3, lookAlike: false, lengths: [2, 4] } },
    { params: { hint: 'word briefly', extraLetters: 3, lookAlike: false, lengths: [2, 4] }, intro: phrases.wordFadesIntro },
    { params: { hint: 'every other letter briefly', extraLetters: 4, lookAlike: true, lengths: [2, 4] }, intro: phrases.someLettersIntro },
    { params: { hint: 'none', extraLetters: 4, lookAlike: true, lengths: [2, 5] }, intro: phrases.hiddenWordIntro },
  ] satisfies Levels<SpellingLevel>,
  memory: [
    { params: { pairs: 3, lookAlikes: false } },
    { params: { pairs: 4, lookAlikes: false }, intro: phrases.moreCardsIntro },
    { params: { pairs: 6, lookAlikes: true }, intro: phrases.lookAlikeCardsIntro },
    { params: { pairs: 8, lookAlikes: true }, intro: phrases.evenMoreCardsIntro },
  ] satisfies Levels<MemoryLevel>,
  // The user's idea (2026-10-26): four piles of four at the top, the cards under the top one hidden.
  sorting: [
    { params: { sets: 3, cardsPerSet: 3, hidden: false, lookAlikes: false } },
    { params: { sets: 3, cardsPerSet: 4, hidden: true, lookAlikes: false }, intro: phrases.moreCardsIntro },
    { params: { sets: 4, cardsPerSet: 4, hidden: true, lookAlikes: false }, intro: phrases.evenMoreCardsIntro },
    { params: { sets: 4, cardsPerSet: 4, hidden: true, lookAlikes: true }, intro: phrases.lookAlikesIntro },
  ] satisfies Levels<SortingLevel>,
  // The user's idea (2026-10-26): the letters stand in fixed places from the start. Level 4 has
  // no look-alikes: no two letters that look alike have four pictures each.
  baskets: [
    { params: { sets: 3, picturesPerSet: 2, piles: 6, hidden: false, lookAlikes: false } },
    { params: { sets: 3, picturesPerSet: 3, piles: 3, hidden: true, lookAlikes: false }, intro: phrases.moreCardsIntro },
    { params: { sets: 4, picturesPerSet: 3, piles: 4, hidden: true, lookAlikes: true }, intro: phrases.lookAlikeCardsIntro },
    { params: { sets: 4, picturesPerSet: 4, piles: 4, hidden: true, lookAlikes: false }, intro: phrases.evenMoreCardsIntro },
  ] satisfies Levels<BasketsLevel>,
  // The user's idea (2026-10-27): first the whole sum is written, then less and less of it.
  fruit: [
    { params: { maxSum: 9, choices: 3, shown: 'all' } },
    { params: { maxSum: 9, choices: 3, shown: 'parts' }, intro: phrases.countYourselfIntro },
    { params: { maxSum: 9, choices: 4, shown: 'first part' }, intro: phrases.oneNumberIntro },
    { params: { maxSum: 10, choices: 4, shown: 'nothing' }, intro: phrases.noNumbersIntro },
  ] satisfies Levels<FruitLevel>,
} as const satisfies Record<ChallengeId, Levels<unknown>>

export function levelParams<C extends ChallengeId>(challenge: C, level: Level): (typeof stationLevels)[C][number]['params'] {
  return stationLevels[challenge][level - 1]!.params
}

export function levelIntro(challenge: ChallengeId, level: Level): string | undefined {
  const { intro } = stationLevels[challenge][level - 1] as StationLevel<unknown>
  return intro
}

/** Identifies one level of a station, e.g. "findLetter:2" (completed levels, first-time XP). */
export function levelKey(challenge: ChallengeId, level: Level): string {
  return `${challenge}:${level}`
}

/** A station's level, and how the last rounds there went. */
export interface StationState {
  level: Level
  /** Scores of the last rounds at this level, newest last. */
  recent: number[]
  /** The level of the last round finished here: a higher level is announced once. */
  played?: Level
}

/**
 * When a station changes level. Every round scores from 0 to 1 with guessing taken out
 * (`chanceCorrected`): 0 is no better than tapping at random, 1 is flawless. Up after
 * `raiseAfter` rounds at a level averaging at least `raiseAt`; down, without a word, after
 * `lowerAfter` rounds averaging at most `lowerAt`; otherwise the station stays where it
 * is. Several rounds count, so one lucky or unlucky round never moves it, and the history
 * starts afresh at a new level. Rewards never depend on this.
 */
export const levelRule = { remember: 3, raiseAfter: 2, raiseAt: 0.8, lowerAfter: 2, lowerAt: 0.3 } as const

/** How much better than guessing: (hit rate − chance) / (1 − chance), between 0 and 1. */
export function chanceCorrected(hitRate: number, chance: number): number {
  if (chance >= 1) return 1
  return Math.min(1, Math.max(0, (hitRate - chance) / (1 - chance)))
}

/** A choice round's score: questions answered right on the first try, with guessing taken out. */
export function firstTryScore(firstTry: readonly boolean[], choiceCounts: readonly number[]): number {
  if (choiceCounts.length === 0) return 1
  const hits = firstTry.filter(Boolean).length / choiceCounts.length
  const chance = choiceCounts.reduce((sum, count) => sum + 1 / count, 0) / choiceCounts.length
  return chanceCorrected(hits, chance)
}

export function stationLevel(state: StationState | undefined): Level {
  return state?.level ?? 1
}

/** The station after a round there scored `score`. */
export function nextStation(state: StationState | undefined, score: number): { state: StationState; change: 'up' | 'down' | null } {
  const level = stationLevel(state)
  const recent = [...(state?.recent ?? []), score].slice(-levelRule.remember)
  const average = (count: number) => recent.slice(-count).reduce((sum, s) => sum + s, 0) / count
  if (level < levelCount && recent.length >= levelRule.raiseAfter && average(levelRule.raiseAfter) >= levelRule.raiseAt) {
    return { state: { level: (level + 1) as Level, recent: [], played: level }, change: 'up' }
  }
  if (level > 1 && recent.length >= levelRule.lowerAfter && average(levelRule.lowerAfter) <= levelRule.lowerAt) {
    return { state: { level: (level - 1) as Level, recent: [], played: level }, change: 'down' }
  }
  return { state: { level, recent, played: level }, change: null }
}

/** Is the level's intro said? Only on the first round after the station went up. */
export function announcesLevel(state: StationState | undefined): boolean {
  return state !== undefined && state.level > (state.played ?? 1)
}
