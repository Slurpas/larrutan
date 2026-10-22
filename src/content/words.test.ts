import { describe, expect, it } from 'vitest'
import { letters } from './letters'
import { alsoCalledLetters, findWordListProblems, findWordProblems } from './validation'
import { couldBeMistaken, getWord, words, type Word } from './words'

const valid: Word = {
  id: 'sun',
  base: 'sol',
  indefinite: 'en sol',
  definite: 'solen',
  picture: '☀️',
  firstLetter: 's',
  firstSound: 's',
  alsoCalled: [],
  status: 'draft',
}

describe('word list', () => {
  it('passes every content rule', () => {
    expect(findWordListProblems(words, letters)).toEqual([])
  })

  it('has 20–30 words and covers every letter, including Å, Ä and Ö', () => {
    expect(words.length).toBeGreaterThanOrEqual(20)
    expect(words.length).toBeLessThanOrEqual(30)
    for (const letter of letters) {
      expect(
        words.some((w) => w.firstLetter === letter.id),
        letter.display,
      ).toBe(true)
    }
  })

  it('leaves out words whose first sound differs from their first letter', () => {
    const bases = words.map((w) => w.base)
    for (const tricky of ['sked', 'kök', 'get', 'hjärta', 'djur', 'ljus', 'olja']) {
      expect(bases).not.toContain(tricky)
    }
  })
})

describe('content validation catches broken entries', () => {
  it('accepts a correct word', () => {
    expect(findWordProblems(valid, letters)).toEqual([])
  })

  it('rejects a word that starts with a different sound than its letter (sked)', () => {
    const sked = { ...valid, id: 'spoon', base: 'sked', definite: 'skeden', indefinite: 'en sked', firstSound: 'sj' }
    expect(findWordProblems(sked, letters).join()).toMatch(/starts with the sound "sj"/)
  })

  it('rejects a silent first letter (ljus)', () => {
    const ljus = { ...valid, id: 'candle', base: 'ljus', definite: 'ljuset', indefinite: 'ett ljus', firstLetter: 'l', firstSound: 'j' }
    expect(findWordProblems(ljus, letters).join()).toMatch(/starts with the sound "j"/)
  })

  it('rejects a first letter that does not match the spelling', () => {
    expect(findWordProblems({ ...valid, firstLetter: 'm', firstSound: 'm' }, letters).join()).toMatch(
      /different first letter/,
    )
  })

  it('rejects unknown letters, empty fields and non-ASCII ids', () => {
    expect(findWordProblems({ ...valid, firstLetter: 'x' }, letters).join()).toMatch(/unknown first letter/)
    expect(findWordProblems({ ...valid, definite: ' ' }, letters).join()).toMatch(/definite is empty/)
    expect(findWordProblems({ ...valid, id: 'sól' }, letters).join()).toMatch(/lower-case ASCII/)
  })

  it('rejects text where Å is written as A plus a combining ring', () => {
    const decomposed = { ...valid, id: 'eight', base: 'Åtta', firstLetter: 'a-ring', firstSound: 'å' }
    expect(findWordProblems(decomposed, letters).join()).toMatch(/not NFC-normalised/)
  })

  it('rejects duplicate ids, words and pictures', () => {
    const problems = findWordListProblems([valid, { ...valid }], letters).join()
    expect(problems).toMatch(/duplicate id/)
    expect(problems).toMatch(/duplicate base/)
    expect(problems).toMatch(/duplicate picture/)
  })
})

describe('ambiguous pictures', () => {
  it('knows which letters another name for the picture would start with', () => {
    expect(alsoCalledLetters(getWord('thunder'), letters)).toEqual(new Set(['m'])) // "moln"
    expect(alsoCalledLetters(getWord('island'), letters)).toEqual(new Set(['s'])) // "strand"
    expect(alsoCalledLetters(getWord('sun'), letters)).toEqual(new Set())
  })

  it('treats pictures as mistakable when one can be called by the other name', () => {
    const rat = { ...valid, id: 'rat', base: 'råtta', picture: '🐀', alsoCalled: [] }
    expect(couldBeMistaken(getWord('mouse'), rat)).toBe(true)
    expect(couldBeMistaken(getWord('mouse'), getWord('sun'))).toBe(false)
  })
})
