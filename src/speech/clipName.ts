import { elevenLabsInput, speechInput } from '../content/pronunciation'
import { retakes } from './retakes'
import { speechVoice, stopgapVoice, type SpeechVoice } from './voiceSettings'

/**
 * The audio file for a sentence: a readable slug plus a hash of everything that
 * shapes the audio (the text, its pauses and pronunciation fixes, the voice, and a
 * retake if there is one), e.g.
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
  const take = retakes[text]
  // Only retaken sentences add their take, so every other clip keeps its name (and its review).
  // What the engine is really given: a Piper pronunciation fix never renames an ElevenLabs clip (that would cost credits).
  const input = voice.engine === 'ElevenLabs' ? elevenLabsInput(text, voice.pauseSeconds, voice.model) : speechInput(text)
  const shapedBy = [text, input, JSON.stringify(voice), ...(take ? [`take ${take}`] : [])].join('\n')
  return `${slug}-${fnv1a(shapedBy.normalize('NFC'))}.mp3`
}

/**
 * The clip the game plays for a sentence, given which files there are: the voice's own, or
 * while ElevenLabs hasn't made it yet, the free voice's (`stopgapVoice`).
 */
export function clipFor(text: string, has: (file: string) => boolean): { file: string; stopgap: boolean } | undefined {
  const own = clipFileName(text)
  if (has(own)) return { file: own, stopgap: false }
  if (speechVoice.engine !== 'ElevenLabs') return undefined
  const stopgap = clipFileName(text, stopgapVoice)
  return has(stopgap) ? { file: stopgap, stopgap: true } : undefined
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
