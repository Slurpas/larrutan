import { describe, expect, it } from 'vitest'
import { choiceCounts, levelAfterRound, levelRules, nextDifficulty } from './difficulty'

describe('station levels', () => {
  it('opens a station at its saved level, easy when never played or when it has no hard level', () => {
    expect(nextDifficulty('findLetter', {})).toBe('easy')
    expect(nextDifficulty('findLetter', { findLetter: 'hard' })).toBe('hard')
    expect(nextDifficulty('wordPicture', { wordPicture: 'hard' })).toBe('easy')
  })

  it('goes up after an easy round with at most one slip, and stays easy after more', () => {
    expect(levelAfterRound('firstLetter', 'easy', 0)).toBe('hard')
    expect(levelAfterRound('firstLetter', 'easy', levelRules.upAtMostWrong)).toBe('hard')
    expect(levelAfterRound('firstLetter', 'easy', levelRules.upAtMostWrong + 1)).toBe('easy')
  })

  it('stays hard after a hard round, and goes back down gently only after many slips', () => {
    expect(levelAfterRound('findLetter', 'hard', 0)).toBe('hard')
    expect(levelAfterRound('findLetter', 'hard', levelRules.downAtLeastWrong - 1)).toBe('hard')
    expect(levelAfterRound('findLetter', 'hard', levelRules.downAtLeastWrong)).toBe('easy')
  })

  it('never moves a station without a hard level', () => {
    expect(levelAfterRound('wordPicture', 'easy', 0)).toBe('easy')
  })

  it('offers more choices at the hard level', () => {
    expect(choiceCounts.hard).toBeGreaterThan(choiceCounts.easy)
  })
})
