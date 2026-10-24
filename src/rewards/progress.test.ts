import { describe, expect, it } from 'vitest'
import type { ChallengeId } from '../challenges/challengeIds'
import type { Difficulty } from '../challenges/difficulty'
import { getItem, items } from './items'
import { completeRound, initialProgress, newItems, seeItems, wear, type Progress } from './progress'
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

/**
 * A plausible way to play (at about five rounds a day): every level once in the first
 * session, then rounds at each sign's hardest level, in turn.
 */
function playRounds(count: number): Progress {
  const firstSession = [
    ['findLetter', 'easy'],
    ['findLetter', 'hard'],
    ['firstLetter', 'easy'],
    ['firstLetter', 'hard'],
    ['wordPicture', 'easy'],
  ] as const
  const replays = [
    ['findLetter', 'hard'],
    ['firstLetter', 'hard'],
    ['wordPicture', 'easy'],
  ] as const
  let progress = initialProgress
  for (let i = 0; i < count; i++) {
    const [challenge, difficulty] = firstSession[i] ?? replays[i % replays.length]!
    progress = play(progress, challenge, difficulty).progress
  }
  return progress
}

const highestRarity = (progress: Progress) => Math.max(0, ...progress.unlockedItems.map((id) => getItem(id).rarity))

describe('unlocks', () => {
  it('gives at most one item, every other round; the others earned come later, in catalogue order', () => {
    // The first round earns the cap and the blue sweater, the second the green trousers too.
    const first = play(initialProgress, 'findLetter')
    expect(first.outcome.newItems).toEqual(['cap'])
    const second = play(first.progress, 'firstLetter')
    expect(second.outcome.newItems).toEqual([])
    const third = play(second.progress, 'wordPicture')
    expect(third.outcome.newItems).toEqual(['blue-sweater'])
    expect(play(third.progress, 'findLetter').outcome.newItems).toEqual([])
  })

  it('never gives more than one item in a round, and never in two rounds in a row, in 200 rounds of play', () => {
    let progress = initialProgress
    let lastItemRound = -2
    for (let i = 0; i < 200; i++) {
      const round = play(progress, (['findLetter', 'firstLetter', 'wordPicture'] as const)[i % 3], i % 2 ? 'hard' : 'easy')
      expect(round.outcome.newItems.length, `round ${i + 1}`).toBeLessThanOrEqual(1)
      if (round.outcome.newItems.length > 0) {
        expect(i - lastItemRound, `round ${i + 1}`).toBeGreaterThanOrEqual(2)
        lastItemRound = i
      }
      progress = round.progress
    }
  })

  it('unlocks each item exactly once', () => {
    const progress = playRounds(120)
    expect(new Set(progress.unlockedItems).size).toBe(progress.unlockedItems.length)
  })

  it('gives only common and uncommon items in the first session (PRD §10)', () => {
    expect(highestRarity(playRounds(6))).toBeLessThanOrEqual(2)
  })

  it('keeps rare items for about a week of play, and epic ones for longer', () => {
    expect(highestRarity(playRounds(15))).toBe(2)
    expect(highestRarity(playRounds(40))).toBe(3)
    expect(highestRarity(playRounds(50))).toBeLessThan(4)
  })

  it('keeps legendary items for long-term goals', () => {
    expect(playRounds(70).unlockedItems).not.toContain('crown')
    expect(playRounds(100).unlockedItems).toContain('crown')
  })

  it('unlocks the rainbow trousers once every letter is mastered, however long it took', () => {
    const allLetters = Object.fromEntries(['a', 'i', 'l', 'm', 'o', 's', 'a-ring', 'a-umlaut', 'o-umlaut'].map((id) => [`findLetter:${id}`, 5]))
    // Everything before the trousers in the list is already handed out, so they are next.
    const before = items.slice(0, items.findIndex((item) => item.id === 'rainbow-trousers')).map((item) => item.id)
    const almost = { ...initialProgress, unlockedItems: before, mastery: { ...allLetters, 'findLetter:m': 4 } }
    expect(play(almost, 'wordPicture').outcome.newItems).not.toContain('rainbow-trousers')
    const all = { ...initialProgress, unlockedItems: before, mastery: allLetters }
    expect(play(all, 'wordPicture').outcome.newItems).toContain('rainbow-trousers')
  })

  it('has items of every rarity, and more common ones than legendary', () => {
    const count = (rarity: number) => items.filter((item) => item.rarity === rarity).length
    for (const rarity of [1, 2, 3, 4, 5]) expect(count(rarity), `rarity ${rarity}`).toBeGreaterThan(0)
    expect(count(1)).toBeGreaterThan(count(5))
    // A big set, so the good things take real play (user feedback 2026-10-24).
    expect(items.length).toBeGreaterThanOrEqual(35)
  })
})

describe('station levels', () => {
  it('announces when a station gets harder, and changes back quietly', () => {
    const clean = play(initialProgress, 'findLetter', 'easy', 0)
    expect(clean.outcome.levelChange).toBe('up')
    expect(clean.progress.levels.findLetter).toBe('hard')
    const stillHard = play(clean.progress, 'findLetter', 'hard', 2)
    expect(stillHard.outcome.levelChange).toBe(null)
    const tooHard = play(stillHard.progress, 'findLetter', 'hard', 5)
    expect(tooHard.outcome.levelChange).toBe('down')
    expect(tooHard.progress.levels.findLetter).toBe('easy')
  })

  it('stays easy after an easy round with several slips, and never changes Ord och bild', () => {
    expect(play(initialProgress, 'firstLetter', 'easy', 3).outcome.levelChange).toBe(null)
    expect(play(initialProgress, 'wordPicture', 'easy', 0).outcome.levelChange).toBe(null)
  })
})

describe('wearing items', () => {
  it('wears one item per slot, swaps within a slot, and takes an item off on a second tap', () => {
    let progress = playRounds(10)
    progress = wear(progress, 'cap')
    progress = wear(progress, 'blue-sweater')
    expect(progress.worn).toEqual({ head: 'cap', top: 'blue-sweater' })
    progress = wear(progress, 'beanie')
    expect(progress.worn).toEqual({ head: 'beanie', top: 'blue-sweater' })
    progress = wear(progress, 'beanie')
    expect(progress.worn).toEqual({ top: 'blue-sweater' })
  })

  it('only lets unlocked items be worn', () => {
    expect(wear(initialProgress, 'crown').worn).toEqual({})
    expect(wear(initialProgress, 'no-such-item').worn).toEqual({})
  })
})

describe('new items', () => {
  it('are the items earned since the child last looked, in the order they came', () => {
    let progress = playRounds(3)
    expect(newItems(progress)).toEqual(progress.unlockedItems)
    progress = seeItems(progress)
    expect(newItems(progress)).toEqual([])
    // Two more rounds: an item comes every other round.
    progress = play(play(progress, 'wordPicture').progress, 'wordPicture').progress
    expect(newItems(progress)).toEqual(progress.unlockedItems.slice(-1))
    expect(seeItems(seeItems(progress))).toEqual(seeItems(progress))
  })
})
