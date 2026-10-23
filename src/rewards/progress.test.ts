import { describe, expect, it } from 'vitest'
import type { ChallengeId } from '../challenges/challengeIds'
import type { Difficulty } from '../challenges/difficulty'
import { items } from './items'
import { completeRound, initialProgress, wear, type Progress } from './progress'
import { levelForXp, levelProgress, xpForLevel } from './rules'

let roundCounter = 0
function play(progress: Progress, challenge: ChallengeId, difficulty: Difficulty = 'easy', wrongTaps = 0) {
  return completeRound(progress, { roundId: `round-${++roundCounter}`, challenge, difficulty, wrongTaps, practiced: [] })
}

describe('XP', () => {
  it('gives full XP the first time a level is completed and less for replays', () => {
    const first = play(initialProgress, 'findLetter')
    const replay = play(first.progress, 'findLetter')
    expect(first.outcome.firstCompletion).toBe(true)
    expect(first.outcome.xpGained).toBe(20)
    expect(replay.outcome.firstCompletion).toBe(false)
    expect(replay.outcome.xpGained).toBeGreaterThan(0)
    expect(replay.outcome.xpGained).toBeLessThan(first.outcome.xpGained)
  })

  it('gives more for the hard level, and counts each level separately', () => {
    const easy = play(initialProgress, 'findLetter', 'easy')
    const hard = play(easy.progress, 'findLetter', 'hard')
    expect(hard.outcome.firstCompletion).toBe(true)
    expect(hard.outcome.xpGained).toBeGreaterThan(easy.outcome.xpGained)
  })

  it('never reduces a reward for wrong answers or hints', () => {
    const perfect = play(initialProgress, 'wordPicture', 'easy', 0)
    const struggled = play(initialProgress, 'wordPicture', 'easy', 12)
    expect(struggled.outcome.xpGained).toBe(perfect.outcome.xpGained)
    expect(struggled.outcome.newItems).toEqual(perfect.outcome.newItems)
  })

  it('never counts the same round twice, even if the event arrives again', () => {
    const completion = {
      roundId: 'same-round',
      challenge: 'firstLetter' as const,
      difficulty: 'easy' as const,
      wrongTaps: 0,
      practiced: [{ item: 'sun', firstTry: true }],
    }
    const once = completeRound(initialProgress, completion)
    const twice = completeRound(once.progress, completion)
    expect(twice.progress).toBe(once.progress)
    expect(twice.progress.xp).toBe(20)
    expect(twice.progress.roundsCompleted).toBe(1)
    expect(twice.outcome).toEqual(once.outcome)
    expect(twice.progress.mastery).toEqual({ 'firstLetter:sun': 2 }) // practised once, not twice
  })

  it('has levels at 30, 70, 120 and 180 XP', () => {
    expect([2, 3, 4, 5].map(xpForLevel)).toEqual([30, 70, 120, 180])
    expect(levelForXp(29)).toBe(1)
    expect(levelForXp(30)).toBe(2)
    expect(levelProgress(50)).toBeCloseTo(0.5)
  })
})

describe('unlocks', () => {
  it('unlocks the cap after the first round, and each item exactly once', () => {
    let progress = initialProgress
    const first = play(progress, 'findLetter')
    expect(first.outcome.newItems).toEqual(['cap'])
    progress = first.progress
    for (let i = 0; i < 30; i++) progress = play(progress, 'wordPicture').progress
    expect(new Set(progress.unlockedItems).size).toBe(progress.unlockedItems.length)
  })

  it('unlocks the bow on reaching level 2', () => {
    const one = play(initialProgress, 'findLetter')
    const two = play(one.progress, 'wordPicture')
    expect(two.outcome.levelBefore).toBe(1)
    expect(two.outcome.levelAfter).toBe(2)
    expect(two.outcome.newItems).toContain('bow')
  })

  it('unlocks the top hat for the hard level of Hitta bokstaven', () => {
    const easy = play(initialProgress, 'findLetter', 'easy')
    expect(easy.progress.unlockedItems).not.toContain('top-hat')
    const hard = play(easy.progress, 'findLetter', 'hard')
    expect(hard.outcome.newItems).toContain('top-hat')
  })

  it('unlocks the graduation cap once every challenge has been completed', () => {
    let progress = play(initialProgress, 'findLetter').progress
    progress = play(progress, 'firstLetter').progress
    expect(progress.unlockedItems).not.toContain('graduation-cap')
    const last = play(progress, 'wordPicture')
    expect(last.outcome.newItems).toContain('graduation-cap')
  })

  it('keeps the legendary crown for real effort: not even every level once is enough', () => {
    let progress = initialProgress
    for (const [challenge, difficulty] of [
      ['findLetter', 'easy'],
      ['findLetter', 'hard'],
      ['firstLetter', 'easy'],
      ['firstLetter', 'hard'],
      ['wordPicture', 'easy'],
    ] as const) {
      progress = play(progress, challenge, difficulty).progress
    }
    expect(progress.unlockedItems).not.toContain('crown')
    while (!progress.unlockedItems.includes('crown')) progress = play(progress, 'wordPicture').progress
    expect(levelForXp(progress.xp)).toBe(5)
  })

  it('has one item per rarity, from common to legendary', () => {
    expect(items.map((item) => item.rarity)).toEqual([1, 2, 3, 4, 5])
  })
})

describe('wearing items', () => {
  it('only lets unlocked items be worn, and can take them off', () => {
    expect(wear(initialProgress, 'crown').wornItem).toBeNull()
    const progress = play(initialProgress, 'findLetter').progress
    const wearing = wear(progress, 'cap')
    expect(wearing.wornItem).toBe('cap')
    expect(wear(wearing, null).wornItem).toBeNull()
  })
})
