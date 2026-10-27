import { describe, expect, it } from 'vitest'
import type { ChallengeId } from '../challenges/challengeIds'
import type { Level } from '../challenges/levels'
import { letters } from '../content/letters'
import { getItem, items } from './items'
import { completeRound, initialProgress, newItems, seeItems, wear, type Progress } from './progress'
import { isItemRound, levelForXp, levelProgress, xpForLevel } from './rules'

let roundCounter = 0
function play(progress: Progress, challenge: ChallengeId, level: Level = 1, score = 1) {
  return completeRound(progress, { roundId: `round-${++roundCounter}`, challenge, level, score, practiced: [] })
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

  it('gives more for level 2, and counts each level separately', () => {
    const first = play(initialProgress, 'findLetter', 1)
    const second = play(first.progress, 'findLetter', 2)
    expect(second.outcome.firstCompletion).toBe(true)
    expect(second.outcome.xpGained).toBeGreaterThan(first.outcome.xpGained)
  })

  it('gives no first-time bonus at levels 3 and 4, so climbing never hurries the items', () => {
    const replay = play(play(initialProgress, 'memory', 2).progress, 'memory', 2)
    for (const level of [3, 4] as const) {
      const first = play(initialProgress, 'memory', level)
      expect(first.outcome.firstCompletion).toBe(true)
      expect(first.outcome.xpGained).toBe(replay.outcome.xpGained)
    }
  })

  it('never reduces a reward for wrong answers or hints', () => {
    const perfect = play(initialProgress, 'wordPicture', 1, 1)
    const struggled = play(initialProgress, 'wordPicture', 1, 0)
    expect(struggled.outcome.xpGained).toBe(perfect.outcome.xpGained)
    expect(struggled.outcome.newItems).toEqual(perfect.outcome.newItems)
  })

  it('never counts the same round twice, even if the event arrives again', () => {
    const completion = {
      roundId: 'same-round',
      challenge: 'firstLetter' as const,
      level: 1 as const,
      score: 1,
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
 * A plausible way to play (at about five rounds a day): the first two levels of three
 * stations in the first session, then rounds there, in turn. Higher levels give the same
 * XP as level 2 replays, so climbing further doesn't change this pace.
 */
function playRounds(count: number): Progress {
  const firstSession = [
    ['findLetter', 1],
    ['findLetter', 2],
    ['firstLetter', 1],
    ['firstLetter', 2],
    ['wordPicture', 1],
  ] as const
  const replays = [
    ['findLetter', 3],
    ['firstLetter', 3],
    ['wordPicture', 1],
  ] as const
  let progress = initialProgress
  for (let i = 0; i < count; i++) {
    const [challenge, level] = firstSession[i] ?? replays[i % replays.length]!
    progress = play(progress, challenge, level).progress
  }
  return progress
}

const highestRarity = (progress: Progress) => Math.max(0, ...progress.unlockedItems.map((id) => getItem(id).rarity))

describe('unlocks', () => {
  it('gives an item every round at first, then every other round, and later every third', () => {
    expect([1, 2, 3, 4, 5, 6].every(isItemRound)).toBe(true)
    expect([7, 8, 9, 10, 31, 32].map(isItemRound)).toEqual([false, true, false, true, false, true])
    expect([33, 34, 35, 36, 37].map(isItemRound)).toEqual([false, true, false, false, true])
  })

  it('gives the first item earned, in catalogue order; the others wait their turn', () => {
    // The cap for the first round; then the blue sweater (Hitta bokstaven done), though the green trousers are earned too.
    const first = play(initialProgress, 'findLetter')
    expect(first.outcome.newItems).toEqual(['cap'])
    const second = play(first.progress, 'firstLetter')
    expect(second.outcome.newItems).toEqual(['blue-sweater'])
    const third = play(second.progress, 'wordPicture')
    expect(third.outcome.newItems).toEqual(['green-trousers'])
  })

  it('never gives more than one item in a round, nor in two rounds in a row after the first six, in 200 rounds of play', () => {
    let progress = initialProgress
    let lastItemRound = -2
    for (let i = 0; i < 200; i++) {
      const round = play(progress, (['findLetter', 'firstLetter', 'wordPicture', 'spelling', 'memory', 'sorting', 'baskets', 'fruit'] as const)[i % 8], ((i % 4) + 1) as Level)
      expect(round.outcome.newItems.length, `round ${i + 1}`).toBeLessThanOrEqual(1)
      if (round.outcome.newItems.length > 0) {
        if (i >= 6) expect(i - lastItemRound, `round ${i + 1}`).toBeGreaterThanOrEqual(2)
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
    const allLetters = Object.fromEntries(letters.map((letter) => [`findLetter:${letter.id}`, 5]))
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
  it('goes up after two good rounds and says so, and goes back down quietly after two poor ones', () => {
    const once = play(initialProgress, 'findLetter', 1, 1)
    expect(once.outcome).toMatchObject({ levelChange: null, stationLevel: 1 })
    const twice = play(once.progress, 'findLetter', 1, 0.9)
    expect(twice.outcome).toMatchObject({ levelChange: 'up', stationLevel: 2 })
    expect(twice.progress.stations.findLetter).toMatchObject({ level: 2, recent: [] })
    const poor = play(twice.progress, 'findLetter', 2, 0.2)
    expect(poor.outcome.levelChange).toBe(null)
    const poorAgain = play(poor.progress, 'findLetter', 2, 0.1)
    expect(poorAgain.outcome).toMatchObject({ levelChange: 'down', stationLevel: 1 })
  })

  it('keeps every station to itself, Ord och bild too', () => {
    let progress = play(play(initialProgress, 'wordPicture', 1, 1).progress, 'wordPicture', 1, 1).progress
    expect(progress.stations.wordPicture?.level).toBe(2)
    progress = play(progress, 'memory', 1, 1).progress
    expect(progress.stations.memory).toEqual({ level: 1, recent: [1], played: 1 })
    expect(progress.stations.findLetter).toBeUndefined()
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
    // Two more rounds, both with an item for a new player.
    progress = play(play(progress, 'wordPicture').progress, 'wordPicture').progress
    expect(newItems(progress)).toEqual(progress.unlockedItems.slice(-2))
    expect(seeItems(seeItems(progress))).toEqual(seeItems(progress))
  })
})
