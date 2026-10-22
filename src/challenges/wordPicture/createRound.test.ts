import { describe, expect, it } from 'vitest'
import { getWord, words, type Word } from '../../content/words'
import { createWordPictureRound, findWordPictureProblems } from './createRound'

const rules = { words, choiceCount: 3 }
const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)
const roundFor = (seed: number) => createWordPictureRound({ seed, words })

describe('createWordPictureRound', () => {
  it('builds valid questions for many seeds', () => {
    for (const seed of seeds) {
      const round = roundFor(seed)
      expect(round.questions).toHaveLength(5)
      for (const question of round.questions) {
        expect(findWordPictureProblems(question, rules), `seed ${seed}`).toEqual([])
      }
    }
  })

  it('never asks for the same picture twice in a round', () => {
    for (const seed of seeds) {
      const targets = roundFor(seed).questions.map((q) => q.target)
      expect(new Set(targets).size, `seed ${seed}`).toBe(targets.length)
    }
  })

  it('reproduces the same round from the same seed', () => {
    expect(roundFor(2024)).toEqual(roundFor(2024))
  })

  it('never shows two pictures that share a name', () => {
    const rat: Word = { ...getWord('mouse'), id: 'rat', base: 'råtta', definite: 'råttan', picture: '🐀', alsoCalled: [] }
    const problems = findWordPictureProblems(
      { target: 'mouse', choices: ['mouse', 'rat', 'sun'] },
      { ...rules, words: [...words, rat] },
    )
    expect(problems.join()).toMatch(/could be mistaken/)
  })
})
