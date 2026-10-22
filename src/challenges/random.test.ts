import { describe, expect, it } from 'vitest'
import { createRng, shuffle } from './random'

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(123)
    const b = createRng(123)
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b))
  })

  it('gives different sequences for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)())
  })

  it('stays within [0, 1)', () => {
    const rng = createRng(99)
    for (let i = 0; i < 1000; i++) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe('shuffle', () => {
  it('returns a permutation and leaves the input untouched', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const result = shuffle(input, createRng(7))
    expect([...result].sort()).toEqual(input)
    expect(input).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})
