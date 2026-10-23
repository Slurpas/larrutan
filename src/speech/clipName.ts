import { withPronunciations } from '../content/pronunciation'
import { speechVoice, type SpeechVoice } from './voiceSettings'

/**
 * The audio file for a sentence: a readable slug plus a hash of everything that
 * shapes the audio (the text, its pronunciation fixes and the voice), e.g.
 * "Var är Å?" → "var-ar-a-1c2d3e4f.mp3". Whenever the audio would sound
 * different, the file name changes too, so a stale recording can never play
 * (not even from a browser cache) and approvals stay tied to what was heard.
 */
export function clipFileName(text: string, voice: SpeechVoice = speechVoice): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // å ä ö → a a o
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  const shapedBy = [text, withPronunciations(text), voice.engine, voice.voice, voice.lengthScale].join('\n')
  return `${slug}-${fnv1a(shapedBy.normalize('NFC'))}.mp3`
}

/** 32-bit FNV-1a, as 8 hex digits. Tiny and stable; collisions are checked in tests. */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5
  for (const char of text) {
    hash ^= char.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}
