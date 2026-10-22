import { describe, expect, it } from 'vitest'
import { confusableLetters, letters } from '../../content/letters'
import { areConfusable, createFindLetterRound, findQuestionProblems } from './createRound'

const rules = { letters, confusables: confusableLetters, choiceCount: 3 }
const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)

describe('createFindLetterRound', () => {
  it('builds valid questions for many seeds', () => {
    for (const seed of seeds) {
      const round = createFindLetterRound({ seed, letters, confusables: confusableLetters })
      expect(round.questions).toHaveLength(5)
      for (const question of round.questions) {
        expect(findQuestionProblems(question, rules), `seed ${seed}`).toEqual([])
      }
    }
  })

  it('never asks for the same letter twice in a round', () => {
    for (const seed of seeds) {
      const targets = createFindLetterRound({ seed, letters, confusables: confusableLetters }).questions.map(
        (q) => q.target,
      )
      expect(new Set(targets).size, `seed ${seed}`).toBe(targets.length)
    }
  })

  it('never mixes look-alikes at the easy level', () => {
    for (const seed of seeds) {
      for (const { choices } of createFindLetterRound({ seed, letters, confusables: confusableLetters }).questions) {
        expect(areConfusable(choices[0]!, choices[1]!, confusableLetters)).toBe(false)
        expect(areConfusable(choices[0]!, choices[2]!, confusableLetters)).toBe(false)
        expect(areConfusable(choices[1]!, choices[2]!, confusableLetters)).toBe(false)
      }
    }
  })

  it('reproduces the same round from the same seed', () => {
    const a = createFindLetterRound({ seed: 2024, letters, confusables: confusableLetters })
    const b = createFindLetterRound({ seed: 2024, letters, confusables: confusableLetters })
    expect(a).toEqual(b)
  })

  it('varies between seeds', () => {
    const rounds = new Set(
      seeds.slice(0, 20).map((seed) => JSON.stringify(createFindLetterRound({ seed, letters, confusables: confusableLetters }).questions)),
    )
    expect(rounds.size).toBeGreaterThan(15)
  })

  it('uses Å, Ä and Ö as targets', () => {
    const targets = new Set(
      seeds.flatMap((seed) =>
        createFindLetterRound({ seed, letters, confusables: confusableLetters }).questions.map((q) => q.target),
      ),
    )
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

describe('findQuestionProblems', () => {
  it('reports a missing answer, duplicates, unknown letters and look-alikes', () => {
    expect(findQuestionProblems({ target: 'a', choices: ['m', 's', 'l'] }, rules)).toContain(
      'the answer must appear exactly once',
    )
    expect(findQuestionProblems({ target: 'a', choices: ['a', 'a', 'm'] }, rules)).toContain(
      'choices must be different letters',
    )
    expect(findQuestionProblems({ target: 'a', choices: ['a', 'x', 'm'] }, rules)).toContain('unknown letter "x"')
    expect(findQuestionProblems({ target: 'a', choices: ['a', 'a-ring', 'm'] }, rules)).toContain(
      '"a" and "a-ring" are easy to mix up',
    )
  })
})
