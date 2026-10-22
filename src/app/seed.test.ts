import { describe, expect, it } from 'vitest'
import { randomSeed, readSeedFromUrl } from './seed'

describe('readSeedFromUrl', () => {
  it('reads a numeric seed', () => {
    expect(readSeedFromUrl('?seed=4242')).toBe(4242)
    expect(readSeedFromUrl('?foo=1&seed=7')).toBe(7)
  })

  it('ignores missing or malformed seeds', () => {
    expect(readSeedFromUrl('')).toBeNull()
    expect(readSeedFromUrl('?seed=')).toBeNull()
    expect(readSeedFromUrl('?seed=-3')).toBeNull()
    expect(readSeedFromUrl('?seed=abc')).toBeNull()
    expect(readSeedFromUrl('?seed=12345678901234')).toBeNull()
  })
})

describe('randomSeed', () => {
  it('stays below a million', () => {
    for (let i = 0; i < 100; i++) expect(randomSeed()).toBeLessThan(1_000_000)
  })
})
