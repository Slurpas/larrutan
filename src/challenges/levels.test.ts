import { describe, expect, it } from 'vitest'
import { confusableLetters, letters } from '../content/letters'
import { words } from '../content/words'
import { challengeNames, type ChallengeId } from './challengeIds'
import { lookAlikeRule } from './difficulty'
import { createFindLetterRound, findFindLetterProblems } from './findLetter/createRound'
import { createFirstLetterRound, findFirstLetterProblems } from './firstLetter/createRound'
import {
  announcesLevel,
  chanceCorrected,
  firstTryScore,
  levelCount,
  levelIntro,
  levelParams,
  levelRule,
  nextStation,
  stationLevel,
  type Level,
  type StationState,
} from './levels'
import { createMemoryRound } from './memory/createRound'
import { createSpellingRound } from './spelling/createRound'
import { createWordPictureRound, findWordPictureProblems } from './wordPicture/createRound'

const challenges = Object.keys(challengeNames) as ChallengeId[]
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
const seeds = Array.from({ length: 100 }, (_, i) => i * 7919 + 1)

/** A station after rounds with these scores, starting from `state` (never played: level 1). */
function play(scores: readonly number[], state?: StationState) {
  const changes: ('up' | 'down' | null)[] = []
  for (const score of scores) {
    const next = nextStation(state, score)
    state = next.state
    changes.push(next.change)
  }
  return { state: state!, changes }
}

describe('a round score', () => {
  it('takes guessing out: tapping at random scores 0, flawless 1', () => {
    expect(chanceCorrected(1, 1 / 3)).toBe(1)
    expect(chanceCorrected(1 / 3, 1 / 3)).toBe(0)
    // Worse than guessing is still 0, and halfway between guessing and flawless is 0.5.
    expect(chanceCorrected(0, 1 / 3)).toBe(0)
    expect(chanceCorrected(0.6, 0.2)).toBeCloseTo(0.5)
  })

  it('counts first-try answers in the choice games: one slip in five, with three choices, scores 0.7', () => {
    const threeChoices = [3, 3, 3, 3, 3]
    expect(firstTryScore([true, true, true, true, true], threeChoices)).toBe(1)
    expect(firstTryScore([true, true, false, true, true], threeChoices)).toBeCloseTo(0.7)
    expect(firstTryScore([false, false, false, false, false], threeChoices)).toBe(0)
    // With four choices guessing is harder, so the same slip costs a little less.
    expect(firstTryScore([true, true, false, true, true], [4, 4, 4, 4, 4])).toBeCloseTo(0.733, 2)
  })
})

describe('station levels', () => {
  it('opens a station never played at level 1, and says nothing new there', () => {
    expect(stationLevel(undefined)).toBe(1)
    expect(announcesLevel(undefined)).toBe(false)
  })

  it('goes up after two good rounds in a row, never after one', () => {
    expect(play([1]).state.level).toBe(1)
    expect(play([1, levelRule.raiseAt])).toMatchObject({ state: { level: 2 }, changes: [null, 'up'] })
    // One slip in five at level 1 of Mata draken scores 0.7: a flawless round makes up for it, a second slip doesn't.
    expect(play([1, 0.7]).state.level).toBe(2)
    expect(play([0.7, 0.7]).state.level).toBe(1)
  })

  it('never moves on one lucky or unlucky round', () => {
    expect(play([0.9, 0.2, 0.9]).changes).toEqual([null, null, null])
    expect(play([0.1, 0.9, 0.1], { level: 3, recent: [] }).changes).toEqual([null, null, null])
  })

  it('goes down after two rounds hardly better than guessing, without saying so', () => {
    const { state, changes } = play([0.2, levelRule.lowerAt], { level: 3, recent: [], played: 3 })
    expect(changes).toEqual([null, 'down'])
    expect(state.level).toBe(2)
    expect(announcesLevel(state)).toBe(false)
  })

  it('stays put for a child doing fine but not great', () => {
    const { state, changes } = play([0.6, 0.5, 0.7, 0.4, 0.6], { level: 2, recent: [] })
    expect(changes.every((change) => change === null)).toBe(true)
    expect(state.recent).toHaveLength(levelRule.remember)
  })

  it('starts counting afresh at a new level', () => {
    const up = play([1, 1]).state
    expect(up.recent).toEqual([])
    expect(play([1], up).state.level).toBe(2)
    expect(play([1, 1], up).state.level).toBe(3)
  })

  it('stops at the top and at the bottom', () => {
    expect(play([1, 1, 1], { level: levelCount, recent: [] }).changes).toEqual([null, null, null])
    expect(play([0, 0, 0]).changes).toEqual([null, null, null])
  })

  it('announces a level on the first round after going up, and only then', () => {
    const up = play([1, 1]).state
    expect(announcesLevel(up)).toBe(true)
    expect(announcesLevel(play([0.5], up).state)).toBe(false)
  })
})

describe('the levels of every station', () => {
  it('has four, and says what is new on each one above the first', () => {
    for (const challenge of challenges) {
      expect(levelIntro(challenge, 1), challenge).toBeUndefined()
      for (const level of [2, 3, 4] as const) expect(levelIntro(challenge, level), `${challenge} ${level}`).toBeTruthy()
    }
  })

  it('never gives Gruvvagnen more than four tunnels', () => {
    for (const level of levels) expect(levelParams('firstLetter', level).choices).toBeLessThanOrEqual(4)
  })

  it('never gets easier going up', () => {
    for (const [lower, higher] of [
      [1, 2],
      [2, 3],
      [3, 4],
    ] as const) {
      for (const challenge of ['findLetter', 'firstLetter'] as const) {
        const [a, b] = [levelParams(challenge, lower), levelParams(challenge, higher)]
        expect(b.choices >= a.choices && b.questions >= a.questions && (b.lookAlikes || !a.lookAlikes), `${challenge} ${higher}`).toBe(true)
      }
      expect(levelParams('wordPicture', higher).choices).toBeGreaterThanOrEqual(levelParams('wordPicture', lower).choices)
      const [s, t] = [levelParams('spelling', lower), levelParams('spelling', higher)]
      const fading = ['word', 'word briefly', 'every other letter briefly', 'none']
      expect(fading.indexOf(t.hint)).toBeGreaterThan(fading.indexOf(s.hint))
      expect(t.extraLetters >= s.extraLetters && t.lengths[1] >= s.lengths[1]).toBe(true)
      expect(levelParams('memory', higher).pairs).toBeGreaterThan(levelParams('memory', lower).pairs)
      const [u, v] = [levelParams('sorting', lower), levelParams('sorting', higher)]
      expect(v.sets * v.cardsPerSet).toBeGreaterThan(u.sets * u.cardsPerSet)
      expect((v.hidden || !u.hidden) && (v.lookAlikes || !u.lookAlikes), `sorting ${higher}`).toBe(true)
    }
  })

  it('builds a valid round at every level, for many seeds', () => {
    for (const seed of seeds)
      for (const level of levels) {
        const letterLevel = levelParams('findLetter', level)
        const findLetterRules = { letters, confusables: confusableLetters, choiceCount: letterLevel.choices, difficulty: lookAlikeRule(letterLevel.lookAlikes) }
        const findLetter = createFindLetterRound({ seed, ...findLetterRules, questionCount: letterLevel.questions })
        expect(findLetter.questions).toHaveLength(letterLevel.questions)
        for (const q of findLetter.questions) expect(findFindLetterProblems(q, findLetterRules), `${seed} ${level}`).toEqual([])

        const rideLevel = levelParams('firstLetter', level)
        const firstLetterRules = { words, letters, confusables: confusableLetters, choiceCount: rideLevel.choices, difficulty: lookAlikeRule(rideLevel.lookAlikes) }
        const firstLetter = createFirstLetterRound({ seed, ...firstLetterRules, questionCount: rideLevel.questions })
        expect(firstLetter.questions).toHaveLength(rideLevel.questions)
        for (const q of firstLetter.questions) expect(findFirstLetterProblems(q, firstLetterRules), `${seed} ${level}`).toEqual([])

        const { choices } = levelParams('wordPicture', level)
        for (const q of createWordPictureRound({ seed, words, choiceCount: choices }).questions) {
          expect(findWordPictureProblems(q, { words, choiceCount: choices }), `${seed} ${level}`).toEqual([])
        }

        const spelling = levelParams('spelling', level)
        const round = createSpellingRound({ seed, words, difficulty: lookAlikeRule(spelling.lookAlike), extras: spelling.extraLetters, lengths: spelling.lengths })
        for (const q of round.questions) {
          expect(q.letters.length, `${seed} ${level} ${q.word}`).toBeGreaterThanOrEqual(spelling.lengths[0])
          expect(q.letters.length, `${seed} ${level} ${q.word}`).toBeLessThanOrEqual(spelling.lengths[1])
        }

        const memory = levelParams('memory', level)
        const board = createMemoryRound({ seed, words, letters, confusables: confusableLetters, difficulty: lookAlikeRule(memory.lookAlikes), pairs: memory.pairs })
        expect(board.cards).toHaveLength(memory.pairs * 2)
      }
  })
})
