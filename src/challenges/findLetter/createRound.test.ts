import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters } from '../../content/letters'
import { choicePairs } from '../choiceQuestion'
import { createFindLetterRound, findFindLetterProblems } from './createRound'

const rules = { letters, confusables: confusableLetters, choiceCount: 3 }
const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)
const roundFor = (seed: number) => createFindLetterRound({ seed, letters, confusables: confusableLetters })

describe('createFindLetterRound', () => {
  it('builds valid questions for many seeds', () => {
    for (const seed of seeds) {
      const round = roundFor(seed)
      expect(round.questions).toHaveLength(5)
      for (const question of round.questions) {
        expect(findFindLetterProblems(question, rules), `seed ${seed}`).toEqual([])
      }
    }
  })

  it('never asks for the same letter twice in a round', () => {
    for (const seed of seeds) {
      const targets = roundFor(seed).questions.map((q) => q.target)
      expect(new Set(targets).size, `seed ${seed}`).toBe(targets.length)
    }
  })

  it('never mixes look-alikes at the easy level', () => {
    for (const seed of seeds) {
      for (const { choices } of roundFor(seed).questions) {
        for (const [a, b] of choicePairs(choices)) expect(areConfusable(a, b, confusableLetters)).toBe(false)
      }
    }
  })

  it('reproduces the same round from the same seed', () => {
    expect(roundFor(2024)).toEqual(roundFor(2024))
  })

  it('varies between seeds', () => {
    const rounds = new Set(seeds.slice(0, 20).map((seed) => JSON.stringify(roundFor(seed).questions)))
    expect(rounds.size).toBeGreaterThan(15)
  })

  it('uses Å, Ä and Ö as targets', () => {
    const targets = new Set(seeds.flatMap((seed) => roundFor(seed).questions.map((q) => q.target)))
    expect(targets).toContain('a-ring')
    expect(targets).toContain('a-umlaut')
    expect(targets).toContain('o-umlaut')
  })

  it('throws instead of building an impossible question', () => {
    const allAlike = [{ ids: letters.map((l) => l.id), reason: 'looks' as const }]
    expect(() => createFindLetterRound({ seed: 1, letters, confusables: allAlike })).toThrow(/Invalid question/)
  })

  it('throws when there are fewer letters than questions', () => {
    expect(() =>
      createFindLetterRound({ seed: 1, letters: letters.slice(0, 2), confusables: [], questionCount: 5 }),
    ).toThrow(/needs at least/)
  })
})

describe('findFindLetterProblems', () => {
  it('reports a missing answer, duplicates, unknown letters and look-alikes', () => {
    const problems = (choices: string[]) => findFindLetterProblems({ target: 'a', choices }, rules)
    expect(problems(['m', 's', 'l'])).toContain('the answer must appear exactly once')
    expect(problems(['a', 'a', 'm'])).toContain('choices must be different')
    expect(problems(['a', 'x', 'm'])).toContain('unknown choice "x"')
    expect(problems(['a', 'a-ring', 'm'])).toContain('"a" and "a-ring" are easy to mix up')
  })
})
