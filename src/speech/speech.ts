import { pickSwedishVoice } from './pickSwedishVoice'

/**
 * Prototype speech using the device's built-in Swedish voice (Web Speech API).
 * Phase 2 replaces this with generated, approved audio files (PRD §7).
 */

export type VoiceStatus = 'loading' | 'ready' | 'missing'

/** Slightly slower than normal, for young listeners. */
const SPEECH_RATE = 0.9
/**
 * iPad Safari can list its voices seconds after the page loads, and may never
 * fire 'voiceschanged' to say so. So the list is also re-read on a timer.
 */
const POLL_EVERY_MS = 500
const POLL_FOR_MS = 60_000
/** Show "no Swedish voice" after this long without one. Checking continues, so it can still recover. */
const GIVE_UP_MS = 5000
/** How long one speak() may wait for voices that are still loading. */
const SPEAK_WAIT_MS = 1500

/** The parts of the Web Speech API we use, so tests can supply a fake. */
export interface SpeechEnv {
  synth: Pick<SpeechSynthesis, 'getVoices' | 'speak' | 'cancel' | 'addEventListener'>
  createUtterance: (text: string) => SpeechSynthesisUtterance
}

export interface Speech {
  /** Call once at startup. */
  init(): void
  /** Call synchronously inside the first tap: iPad Safari only allows speech after one started from a gesture. */
  unlock(): void
  /** Says the text in Swedish, interrupting anything already being said. Resolves when done, or at once without a voice. */
  speak(text: string): Promise<void>
  stop(): void
  getStatus(): VoiceStatus
  subscribe(listener: () => void): () => void
}

export function createSpeech(env: SpeechEnv | null): Speech {
  let status: VoiceStatus = 'loading'
  let voice: SpeechSynthesisVoice | undefined
  let unlocked = false
  // Chrome can garbage-collect an utterance mid-speech and never fire 'end'; holding a reference prevents that.
  let currentUtterance: SpeechSynthesisUtterance | null = null
  const listeners = new Set<() => void>()

  function setStatus(next: VoiceStatus) {
    if (next === status) return
    status = next
    listeners.forEach((listener) => listener())
  }

  /** Re-reads the device's voice list. Cheap, so it is called often. */
  function refreshVoices() {
    if (!env) return
    const voices = env.synth.getVoices()
    if (voices.length === 0) return // not loaded yet
    voice = pickSwedishVoice(voices)
    setStatus(voice ? 'ready' : 'missing')
  }

  async function waitForVoice() {
    const deadline = Date.now() + SPEAK_WAIT_MS
    while (!voice && status === 'loading' && Date.now() < deadline) {
      await sleep(100)
      refreshVoices()
    }
  }

  return {
    init() {
      if (!env) {
        setStatus('missing')
        return
      }
      env.synth.addEventListener('voiceschanged', refreshVoices)
      refreshVoices()

      const started = Date.now()
      const poll = setInterval(() => {
        refreshVoices()
        if (Date.now() - started >= POLL_FOR_MS) clearInterval(poll)
      }, POLL_EVERY_MS)
      setTimeout(() => {
        if (status === 'loading') setStatus('missing')
      }, GIVE_UP_MS)
    },

    unlock() {
      if (!env || unlocked) return
      unlocked = true
      refreshVoices()
      const utterance = env.createUtterance('')
      utterance.volume = 0
      env.synth.speak(utterance)
    },

    async speak(text) {
      if (!env) return
      refreshVoices()
      if (!voice) await waitForVoice()
      const chosen = voice
      if (!chosen) return

      env.synth.cancel()
      const utterance = env.createUtterance(text)
      utterance.voice = chosen
      utterance.lang = chosen.lang
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
        env.synth.speak(utterance)
      })
    },

    stop() {
      env?.synth.cancel()
    },

    getStatus: () => status,

    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const browserSpeech = createSpeech(
  typeof window !== 'undefined' && 'speechSynthesis' in window
    ? { synth: window.speechSynthesis, createUtterance: (text) => new SpeechSynthesisUtterance(text) }
    : null,
)

export const initSpeech = () => browserSpeech.init()
export const unlockSpeech = () => browserSpeech.unlock()
export const speak = (text: string) => browserSpeech.speak(text)
export const stopSpeech = () => browserSpeech.stop()
export const getVoiceStatus = () => browserSpeech.getStatus()
export const subscribeVoiceStatus = (listener: () => void) => browserSpeech.subscribe(listener)
