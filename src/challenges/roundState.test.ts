import { describe, expect, it } from 'vitest'
import type { ChoiceRound } from './choiceQuestion'
import { advance, choose, currentQuestion, isAnswerRevealed, startRound } from './roundState'

const round: ChoiceRound = {
  seed: 1,
  questions: [
    { target: 'a', choices: ['m', 'a', 's'] },
    { target: 'o-umlaut', choices: ['o-umlaut', 'l', 'i'] },
  ],
}

describe('round state', () => {
  it('marks a correct answer, then moves to the next question', () => {
    const correct = choose(startRound(round), 'a')
    expect(correct.phase).toBe('correct')

    const next = advance(correct)
    expect(next.phase).toBe('asking')
    expect(currentQuestion(next)?.target).toBe('o-umlaut')
    expect(next.removed).toEqual([])
  })

  it('greys out a wrong choice and lets the child try again', () => {
    const state = choose(startRound(round), 'm')
    expect(state.phase).toBe('asking')
    expect(state.removed).toEqual(['m'])
    expect(state.wrongTaps).toBe(1)
    expect(isAnswerRevealed(state)).toBe(false)
    expect(choose(state, 'a').phase).toBe('correct')
  })

  it('reveals the answer once every wrong choice is gone', () => {
    const state = choose(choose(startRound(round), 'm'), 's')
    expect(isAnswerRevealed(state)).toBe(true)
    expect(choose(state, 'a').phase).toBe('correct')
  })

  it('ignores taps on greyed-out choices, unknown choices and taps during praise', () => {
    const wrong = choose(startRound(round), 'm')
    expect(choose(wrong, 'm')).toBe(wrong)
    expect(choose(wrong, 'x')).toBe(wrong)

    const correct = choose(wrong, 'a')
    expect(choose(correct, 's')).toBe(correct)
  })

  it('finishes after the last question', () => {
    let state = advance(choose(startRound(round), 'a'))
    state = advance(choose(state, 'o-umlaut'))
    expect(state.phase).toBe('finished')
    expect(currentQuestion(state)).toBeUndefined()
  })
})
