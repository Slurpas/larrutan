import { describe, expect, it } from 'vitest'
import { pickSwedishVoice } from './pickSwedishVoice'

const voice = (name: string, lang: string) => ({ name, lang })

describe('pickSwedishVoice', () => {
  it('returns undefined when there is no Swedish voice', () => {
    expect(pickSwedishVoice([voice('Samantha', 'en-US'), voice('Anna', 'de-DE')])).toBeUndefined()
  })

  it('does not mistake other languages starting with "sv" letters for Swedish', () => {
    expect(pickSwedishVoice([voice('Swahili', 'sw-KE'), voice('Odd', 'svx')])).toBeUndefined()
  })

  it('prefers Swedish from Sweden over Finland-Swedish', () => {
    const picked = pickSwedishVoice([voice('Finland', 'sv-FI'), voice('Alva', 'sv-SE')])
    expect(picked?.name).toBe('Alva')
  })

  it('prefers higher-quality voices', () => {
    const picked = pickSwedishVoice([
      voice('Alva', 'sv-SE'),
      voice('Alva (Enhanced)', 'sv-SE'),
      voice('Google svenska', 'sv-SE'),
    ])
    expect(picked?.name).toBe('Alva (Enhanced)')
  })

  it('prefers Google over basic local voices', () => {
    const picked = pickSwedishVoice([
      voice('Microsoft Bengt - Swedish (Sweden)', 'sv-SE'),
      voice('Google svenska', 'sv-SE'),
    ])
    expect(picked?.name).toBe('Google svenska')
  })

  it('understands Android-style language codes', () => {
    expect(pickSwedishVoice([voice('Android', 'sv_SE')])?.name).toBe('Android')
  })
})
