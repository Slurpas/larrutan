import { describe, expect, it } from 'vitest'
import { spokenTexts } from '../speech/catalogue'
import { elevenLabsInput, pronunciations, speechInput, withPauses, withPronunciations } from './pronunciation'

describe('pronunciation fixes', () => {
  it('replaces whole words only, keeping punctuation and capitals elsewhere', () => {
    expect(withPronunciations('Du fick en keps!')).toBe('Du fick en [[ kˈɛps! ]]')
    expect(withPronunciations('Var är ananasen?')).toBe('Var är [[ ˈananasən? ]]')
    expect(withPronunciations('Orm.')).toBe('[[ ˈʊrm. ]]')
    expect(withPronunciations('Klara en runda så får du kepsen.')).toBe('Klara en runda så får du [[ kˈɛpsən. ]]')
    expect(withPronunciations('Var är A?')).toBe('Var är A?')
  })

  it('pauses before what the child must find in "Var är …?" and "Draken vill ha ett …!", and nowhere else', () => {
    expect(withPauses('Var är Å?')).toBe('Var är, | Å?')
    expect(withPauses('Var är solen?')).toBe('Var är, | solen?')
    expect(withPauses('Draken vill ha ett Ö!')).toBe('Draken vill ha ett, | Ö!')
    expect(withPauses('Bygg ordet sol!')).toBe('Bygg ordet, | sol!')
    expect(withPauses('Det där är Å.')).toBe('Det där är Å.')
    expect(withPauses('Vilken bokstav börjar sol på?')).toBe('Vilken bokstav börjar sol på?')
    expect(speechInput('Var är ananasen?')).toBe('Var är, | [[ ˈananasən? ]]')
    // ElevenLabs pauses where told to, and gets none of Piper's sound notation.
    expect(elevenLabsInput('Var är ananasen?', 0.4, 'eleven_multilingual_v2')).toBe('Var är, <break time="0.4s" /> ananasen?')
    expect(elevenLabsInput('Bygg ordet sol!', 0.4, 'eleven_v3')).toBe('Bygg ordet, … sol!')
    expect(elevenLabsInput('Robot.', 0.4, 'eleven_multilingual_v2')).toBe('Robot.')
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
