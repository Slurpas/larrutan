import { describe, expect, it } from 'vitest'
import { createRng, shuffle } from '../challenges/random'
import { boxOf, highestBox, lowestBox, practiceOrder, recordPractice } from './mastery'

describe('Leitner boxes', () => {
  it('moves an item up when right first time and down one box after a slip', () => {
    const once = recordPractice({}, 'findLetter', [{ item: 'A', firstTry: true }])
    expect(boxOf(once, 'findLetter:A')).toBe(2)
    const twice = recordPractice(once, 'findLetter', [{ item: 'A', firstTry: true }])
    expect(boxOf(twice, 'findLetter:A')).toBe(3)
    const slip = recordPractice(twice, 'findLetter', [{ item: 'A', firstTry: false }])
    expect(boxOf(slip, 'findLetter:A')).toBe(2) // gentle: one box, not back to the start
  })

  it('stays between the first and the last box', () => {
    let mastery = recordPractice({}, 'wordPicture', [{ item: 'sun', firstTry: false }])
    expect(boxOf(mastery, 'wordPicture:sun')).toBe(lowestBox)
    for (let i = 0; i < 10; i++) mastery = recordPractice(mastery, 'wordPicture', [{ item: 'sun', firstTry: true }])
    expect(boxOf(mastery, 'wordPicture:sun')).toBe(highestBox)
  })

  it('keeps each challenge separate', () => {
    const mastery = recordPractice({}, 'findLetter', [{ item: 'S', firstTry: true }])
    expect(boxOf(mastery, 'firstLetter:S')).toBe(lowestBox)
  })
})

describe('practice order', () => {
  const letters = ['A', 'I', 'L', 'M', 'O', 'S', 'Å', 'Ä', 'Ö']

  it('is exactly the plain shuffle while everything is in the same box', () => {
    for (let seed = 1; seed < 50; seed++) {
      expect(practiceOrder(letters, () => 3, createRng(seed))).toEqual(shuffle(letters, createRng(seed)))
    }
  })

  it('brings items still being learned into a round far more often, without dropping known ones', () => {
    // M is new (box 1); everything else is well known (box 5).
    const box = (id: string) => (id === 'M' ? 1 : 5)
    let newInRound = 0
    let knownInRound = 0
    const seeds = 2000
    for (let seed = 1; seed <= seeds; seed++) {
      const round = practiceOrder(letters, box, createRng(seed)).slice(0, 5)
      if (round.includes('M')) newInRound++
      if (round.includes('S')) knownInRound++
    }
    expect(newInRound / seeds).toBeGreaterThan(0.95)
    expect(knownInRound / seeds).toBeGreaterThan(0.3) // known letters still come back
    expect(knownInRound / seeds).toBeLessThan(0.6)
  })

  it('is reproducible for the same seed and boxes', () => {
    const box = (id: string) => (id < 'M' ? 1 : 4)
    expect(practiceOrder(letters, box, createRng(9))).toEqual(practiceOrder(letters, box, createRng(9)))
  })
})
