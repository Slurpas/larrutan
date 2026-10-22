import { describe, expect, it } from 'vitest'
import { confusableLetters, getLetter, letters } from './letters'
import { phrases } from './phrases'

describe('letter content', () => {
  it('has unique ids and unique displayed letters', () => {
    expect(new Set(letters.map((l) => l.id)).size).toBe(letters.length)
    expect(new Set(letters.map((l) => l.display)).size).toBe(letters.length)
  })

  it('shows exactly one upper-case character per letter', () => {
    for (const letter of letters) {
      expect([...letter.display], letter.id).toHaveLength(1)
      expect(letter.display, letter.id).toBe(letter.display.toLocaleUpperCase('sv'))
      expect(letter.spoken.trim(), letter.id).not.toBe('')
    }
  })

  it('includes Å, Ä and Ö as single precomposed characters', () => {
    // "Å" can also be written as A + a combining ring; that version would break comparison and display.
    expect(getLetter('a-ring').display).toBe('Å')
    expect(getLetter('a-umlaut').display).toBe('Ä')
    expect(getLetter('o-umlaut').display).toBe('Ö')
    for (const letter of letters) {
      expect(letter.display, letter.id).toBe(letter.display.normalize('NFC'))
      expect(letter.spoken, letter.id).toBe(letter.spoken.normalize('NFC'))
    }
  })

  it('keeps Å, Ä and Ö intact in spoken sentences', () => {
    expect(phrases.findLetterQuestion(getLetter('a-ring').spoken)).toBe('Var är Å?')
    expect(phrases.thatIs(getLetter('a-umlaut').spoken)).toBe('Det där är Ä.')
    expect(phrases.hereIs(getLetter('o-umlaut').spoken)).toBe('Här är Ö!')
    expect(phrases.firstLetterShort('öra')).toBe('Öra.')
    expect(phrases.firstLetterShort('åska')).toBe('Åska.')
  })

  it('sorts in Swedish alphabetical order, with Å Ä Ö after the other letters', () => {
    const sorted = [...letters].sort((a, b) => a.display.localeCompare(b.display, 'sv'))
    expect(sorted.map((l) => l.display).join('')).toBe('AILMOSÅÄÖ')
  })

  it('only refers to existing letters in look-alike groups', () => {
    for (const group of confusableLetters) {
      expect(group.ids.length).toBeGreaterThanOrEqual(2)
      for (const id of group.ids) expect(() => getLetter(id)).not.toThrow()
    }
  })
})
