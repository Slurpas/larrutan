import { describe, expect, it } from 'vitest'
import { areConfusable, confusableLetters, letters, lookAlikesOf } from '../../content/letters'
import { choicePairs } from '../choiceQuestion'
import { createFindLetterRound, findFindLetterProblems } from './createRound'

const rules = { letters, confusables: confusableLetters, choiceCount: 3, difficulty: 'easy' as const }
const hardRules = { ...rules, choiceCount: 4, difficulty: 'hard' as const }
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

  it('asks about letters still being learned far more often, with valid questions at both levels', () => {
    const box = (id: string) => (id === 'm' ? 1 : 5)
    const easyRounds = seeds.map((seed) =>
      createFindLetterRound({ seed, letters, confusables: confusableLetters, practiceBox: box }).questions.map((q) => q.target),
    )
    expect(easyRounds.filter((targets) => targets.includes('m')).length / easyRounds.length).toBeGreaterThan(0.85)
    // The hard level always asks about the look-alike letters first; practice only changes their order.
    for (const seed of seeds) {
      for (const difficulty of ['easy', 'hard'] as const) {
        const round = createFindLetterRound({ seed, letters, confusables: confusableLetters, difficulty, practiceBox: box })
        for (const question of round.questions) {
          expect(findFindLetterProblems(question, difficulty === 'hard' ? hardRules : rules), `seed ${seed}`).toEqual([])
        }
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

describe('createFindLetterRound, hard level', () => {
  const hardRound = (seed: number) =>
    createFindLetterRound({ seed, letters, confusables: confusableLetters, difficulty: 'hard' })

  it('builds valid questions for many seeds', () => {
    for (const seed of seeds) {
      for (const question of hardRound(seed).questions) {
        expect(findFindLetterProblems(question, hardRules), `seed ${seed}`).toEqual([])
      }
    }
  })

  it('offers four letters, asks about letters with look-alikes and offers them, and one letter unlike the answer', () => {
    for (const seed of seeds.slice(0, 50)) {
      for (const { target, choices } of hardRound(seed).questions) {
        expect(choices, `seed ${seed}`).toHaveLength(4)
        expect(lookAlikesOf(target, confusableLetters).length, target).toBeGreaterThan(0)
        const lookAlikes = choices.filter((c) => c !== target && areConfusable(c, target, confusableLetters))
        expect(lookAlikes.length, `seed ${seed}, ${target}`).toBeGreaterThanOrEqual(1)
        expect(lookAlikes.length, `seed ${seed}, ${target}`).toBeLessThanOrEqual(2)
      }
    }
  })

  it('differs from the easy level for the same seed', () => {
    expect(hardRound(7)).not.toEqual(roundFor(7))
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
