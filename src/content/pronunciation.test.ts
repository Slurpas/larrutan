import { describe, expect, it } from 'vitest'
import { spokenTexts } from '../speech/catalogue'
import { pronunciations, withPronunciations } from './pronunciation'

describe('pronunciation fixes', () => {
  it('replaces whole words only, keeping punctuation and capitals elsewhere', () => {
    expect(withPronunciations('Du fick en keps!')).toBe('Du fick en [[ kˈɛps! ]]')
    expect(withPronunciations('Var är ananasen?')).toBe('Var är [[ ˈananasən? ]]')
    expect(withPronunciations('Orm.')).toBe('[[ ˈʊrm. ]]')
    expect(withPronunciations('Klara en runda så får du kepsen.')).toBe('Klara en runda så får du [[ kˈɛpsən. ]]')
    expect(withPronunciations('Var är A?')).toBe('Var är A?')
  })

  it('only lists words the game actually says', () => {
    const said = new Set(spokenTexts().flatMap((text) => text.toLocaleLowerCase('sv').match(/\p{L}+/gu) ?? []))
    for (const word of Object.keys(pronunciations)) expect(said, word).toContain(word)
  })

  it('uses espeak symbols, e.g. "ɡ" rather than the letter "g"', () => {
    for (const [word, ipa] of Object.entries(pronunciations)) {
      expect(ipa, word).not.toMatch(/g/)
      expect(ipa.trim(), word).not.toBe('')
    }
  })
})
