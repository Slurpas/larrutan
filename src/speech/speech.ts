import { pickSwedishVoice } from './pickSwedishVoice'

/**
 * Prototype speech using the device's built-in Swedish voice (Web Speech API).
 * Phase 2 replaces this with generated, approved audio files (PRD §7).
 */

export type VoiceStatus = 'loading' | 'ready' | 'missing'

/** Slightly slower than normal, for young listeners. */
const SPEECH_RATE = 0.9
/** How long to wait for the browser to list its voices before deciding there is no Swedish one. */
const VOICE_LOAD_LIMIT_MS = 2000

let status: VoiceStatus = 'loading'
let voice: SpeechSynthesisVoice | undefined
let unlocked = false
// Chrome can garbage-collect an utterance mid-speech and never fire 'end'; holding a reference prevents that.
let currentUtterance: SpeechSynthesisUtterance | null = null

const listeners = new Set<() => void>()
let markVoicesLoaded: () => void = () => {}
const voicesLoaded = new Promise<void>((resolve) => {
  markVoicesLoaded = resolve
})

function synth(): SpeechSynthesis | undefined {
  return 'speechSynthesis' in window ? window.speechSynthesis : undefined
}

function setStatus(next: VoiceStatus): void {
  if (next !== 'loading') markVoicesLoaded()
  if (next === status) return
  status = next
  listeners.forEach((listener) => listener())
}

/** Call once at startup. Voices load asynchronously in some browsers. */
export function initSpeech(): void {
  const s = synth()
  if (!s) {
    setStatus('missing')
    return
  }

  const update = () => {
    const voices = s.getVoices()
    if (voices.length === 0) return
    voice = pickSwedishVoice(voices)
    setStatus(voice ? 'ready' : 'missing')
  }
  s.addEventListener('voiceschanged', update)
  update()
  setTimeout(() => {
    if (status === 'loading') setStatus('missing')
  }, VOICE_LOAD_LIMIT_MS)
}

export function getVoiceStatus(): VoiceStatus {
  return status
}

export function subscribeVoiceStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Call synchronously inside the first tap. iPad Safari only allows speech
 * after an utterance has been started from a user gesture.
 */
export function unlockSpeech(): void {
  const s = synth()
  if (!s || unlocked) return
  unlocked = true
  const utterance = new SpeechSynthesisUtterance('')
  utterance.volume = 0
  s.speak(utterance)
}

/**
 * Says the text in Swedish, interrupting anything already being said.
 * Resolves when finished, or straight away if there is no Swedish voice.
 */
export async function speak(text: string): Promise<void> {
  const s = synth()
  if (!s) return
  await voicesLoaded
  if (!voice) return

  s.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = voice.lang
  utterance.rate = SPEECH_RATE
  currentUtterance = utterance

  await new Promise<void>((resolve) => {
    // Some browsers never fire 'end'; the game must never wait forever.
    const fallback = setTimeout(finish, 2000 + text.length * 150)
    function finish() {
      clearTimeout(fallback)
      if (currentUtterance === utterance) currentUtterance = null
      resolve()
    }
    utterance.onend = finish
    utterance.onerror = finish
    s.speak(utterance)
  })
}

export function stopSpeech(): void {
  synth()?.cancel()
}
