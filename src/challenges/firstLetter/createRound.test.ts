import { describe, expect, it } from 'vitest'
import { confusableLetters, letters } from '../../content/letters'
import { getWord, words, type Word } from '../../content/words'
import { createFirstLetterRound, findFirstLetterProblems } from './createRound'

const rules = { words, letters, confusables: confusableLetters, choiceCount: 3 }
const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1)
const roundFor = (seed: number) => createFirstLetterRound({ seed, words, letters, confusables: confusableLetters })

describe('createFirstLetterRound', () => {
  it('builds valid questions for many seeds', () => {
    for (const seed of seeds) {
      const round = roundFor(seed)
      expect(round.questions).toHaveLength(5)
      for (const question of round.questions) {
        expect(findFirstLetterProblems(question, rules), `seed ${seed}`).toEqual([])
      }
    }
  })

  it('asks about a different first letter in each question', () => {
    for (const seed of seeds) {
      const targets = roundFor(seed).questions.map((q) => q.target)
      expect(new Set(targets).size, `seed ${seed}`).toBe(targets.length)
    }
  })

  it('makes the answer the first letter of the pictured word', () => {
    for (const question of roundFor(77).questions) {
      expect(question.target).toBe(getWord(question.word).firstLetter)
    }
  })

  it('never offers a letter that another name for the picture starts with', () => {
    // Åska can also be called "moln", so M must never be a wrong choice next to it.
    for (const seed of seeds) {
      for (const question of roundFor(seed).questions.filter((q) => q.word === 'thunder')) {
        expect(question.choices).not.toContain('m')
      }
    }
  })

  it('reproduces the same round from the same seed', () => {
    expect(roundFor(2024)).toEqual(roundFor(2024))
  })

  it('reports a misleading or wrong answer', () => {
    expect(findFirstLetterProblems({ word: 'thunder', target: 'a-ring', choices: ['a-ring', 'm', 'l'] }, rules).join()).toMatch(
      /could also be right/,
    )
    expect(findFirstLetterProblems({ word: 'sun', target: 'm', choices: ['m', 's', 'l'] }, rules).join()).toMatch(
      /does not start with/,
    )
  })

  it('refuses to use a word whose first sound differs from its letter', () => {
    const sked: Word = { ...getWord('sun'), id: 'spoon', base: 'sked', picture: '🥄', firstSound: 'sj' }
    const problems = findFirstLetterProblems(
      { word: 'spoon', target: 's', choices: ['s', 'm', 'l'] },
      { ...rules, words: [...words, sked] },
    )
    expect(problems.join()).toMatch(/starts with the sound "sj"/)
  })
})
