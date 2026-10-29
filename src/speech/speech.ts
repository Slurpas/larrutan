import silenceUrl from './audio/silence.mp3?url'
import { createBrowserVoice, type BrowserVoiceInfo, type VoiceStatus } from './browserVoice'
import { clipFor } from './clipName'
import { createClipPlayer } from './clipPlayer'
import { createEventLog } from './eventLog'

export type { VoiceStatus } from './browserVoice'

/**
 * Everything the game says or plays goes through here. Sentences play from
 * generated audio files (`npm run speech`, PRD §7), which work in every
 * browser; the device's own Swedish voice is only used for a sentence without
 * a file. Sound effects (`npm run sfx`) play through the same channel, so a
 * new sentence or sound always stops the previous one; playEffect is the exception,
 * for small sounds (a bubble popping) that must never cut off what is being said.
 */

export type SoundId = 'correct' | 'fanfare' | 'levelUp' | 'newItem' | 'pop' | 'knock' | 'splash'
/** Something to say (a sentence), play (a sound effect) or wait for (a pause, in milliseconds). */
export type Utterance = string | { sound: SoundId } | { pause: number }

const byFileName = (urls: Record<string, string>) =>
  new Map(Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1), url]))

/** Generated clips, by file name. Bundled with the game. */
const clipUrls = byFileName(import.meta.glob<string>('./audio/sv/*.mp3', { eager: true, query: '?url', import: 'default' }))
const soundUrls = byFileName(
  import.meta.glob<string>('../sound/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }),
)

const log = createEventLog()
const deviceVoice = createBrowserVoice(
  typeof window !== 'undefined' && 'speechSynthesis' in window
    ? { synth: window.speechSynthesis, createUtterance: (text) => new SpeechSynthesisUtterance(text) }
    : null,
  log,
)
const clips = createClipPlayer(silenceUrl, log)
/** A second player for playEffect, so effects and speech can sound at the same time. */
const effects = createClipPlayer(silenceUrl, log)
/** Bumped by every speak() and stopSpeech(); an older speak() still in progress gives up. */
let turn = 0

const quote = (text: string) => JSON.stringify(text.length > 40 ? `${text.slice(0, 40)}…` : text)

/** The generated clip for a sentence, if there is one: its file, its URL, and whether the free voice says it for now. */
export function clipOf(text: string): { file: string; url: string; stopgap: boolean } | undefined {
  const clip = clipFor(text, (file) => clipUrls.has(file))
  return clip && { ...clip, url: clipUrls.get(clip.file)! }
}

/** Call once at startup. */
export function initSpeech(): void {
  deviceVoice.init()
}

/** Call synchronously inside the first tap: iPad Safari only allows sound after a tap has started some. */
export function unlockSpeech(): void {
  clips.unlock()
  effects.unlock()
  deviceVoice.unlock()
}

/** Plays a short sound effect right away, on its own, without stopping any speech. */
export function playEffect(sound: SoundId): void {
  const url = soundUrls.get(`${sound}.mp3`)
  if (url) void effects.play(url, `effect ${sound}`)
}

/** Says sentences and plays sounds in order, interrupting anything already playing. Resolves when done. */
export async function speak(items: Utterance | readonly Utterance[]): Promise<void> {
  const myTurn = ++turn
  clips.stop()
  deviceVoice.stop()
  const list: readonly Utterance[] = typeof items === 'string' || !Array.isArray(items) ? [items as Utterance] : items
  for (const item of list) {
    if (myTurn !== turn) return
    if (typeof item !== 'string' && 'pause' in item) {
      await new Promise((resolve) => setTimeout(resolve, item.pause))
      continue
    }
    if (typeof item !== 'string') {
      const soundUrl = soundUrls.get(`${item.sound}.mp3`)
      if (soundUrl) await clips.play(soundUrl, `sound ${item.sound}`)
      continue
    }
    const text = item
    const url = clipOf(text)?.url
    if (url) {
      const outcome = await clips.play(url, quote(text))
      // E.g. iPad Safari refusing to play: better the device's own voice than silence.
      if (outcome === 'failed' && myTurn === turn) await deviceVoice.speak(text)
    } else {
      log.note(`no clip for ${quote(text)}, trying the device voice`)
      await deviceVoice.speak(text)
    }
  }
}

export function stopSpeech(): void {
  turn++
  clips.stop()
  deviceVoice.stop()
}

/** With generated clips the game can always speak; otherwise it depends on the device having a Swedish voice. */
export function getVoiceStatus(): VoiceStatus {
  return clipUrls.size > 0 ? 'ready' : deviceVoice.getStatus()
}

export function subscribeVoiceStatus(listener: () => void): () => void {
  return deviceVoice.subscribe(listener)
}

/** What the ?debug=voices panel shows. */
export interface SpeechDebugInfo {
  clipCount: number
  device: BrowserVoiceInfo
  events: string[]
}

export function getSpeechDebugInfo(): SpeechDebugInfo {
  return { clipCount: clipUrls.size, device: deviceVoice.getInfo(), events: log.entries() }
}
