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
/** Online voices in Chrome and Edge can drop an utterance queued right after a cancel; give them a moment. */
const CANCEL_SETTLE_MS = 120
/** How many recent speech events the diagnostic panel shows. */
const EVENT_LOG_SIZE = 30

/** The parts of the Web Speech API we use, so tests can supply a fake. */
export interface SpeechEnv {
  synth: Pick<
    SpeechSynthesis,
    'getVoices' | 'speak' | 'cancel' | 'resume' | 'speaking' | 'pending' | 'addEventListener'
  >
  createUtterance: (text: string) => SpeechSynthesisUtterance
}

/** What the ?debug=voices panel shows. */
export interface SpeechDebugInfo {
  status: VoiceStatus
  chosenVoice: string | null
  swedishVoices: string[]
  totalVoices: number
  events: string[]
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
  getDebugInfo(): SpeechDebugInfo
}

const describeVoice = (v: SpeechSynthesisVoice) => `${v.name} (${v.lang}, ${v.localService ? 'local' : 'online'})`

export function createSpeech(env: SpeechEnv | null): Speech {
  let status: VoiceStatus = 'loading'
  let voice: SpeechSynthesisVoice | undefined
  let unlocked = false
  // Chrome can garbage-collect an utterance mid-speech and never fire 'end'; holding a reference prevents that.
  let currentUtterance: SpeechSynthesisUtterance | null = null
  /** Bumped by every speak() and stop(); an older speak() that is still waiting gives up. */
  let turn = 0
  const listeners = new Set<() => void>()
  const events: string[] = []
  const startedAt = Date.now()

  function note(event: string) {
    events.push(`${((Date.now() - startedAt) / 1000).toFixed(1)}s ${event}`)
    if (events.length > EVENT_LOG_SIZE) events.shift()
  }

  function setStatus(next: VoiceStatus) {
    if (next === status) return
    status = next
    note(`status ${next}${voice ? `: ${describeVoice(voice)}` : ''}`)
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
      note('unlock')
      refreshVoices()
      const utterance = env.createUtterance('')
      utterance.volume = 0
      env.synth.speak(utterance)
    },

    async speak(text) {
      if (!env) return
      const { synth } = env
      const myTurn = ++turn
      const label = JSON.stringify(text.length > 40 ? `${text.slice(0, 40)}…` : text)

      refreshVoices()
      if (!voice) await waitForVoice()
      const chosen = voice
      if (myTurn !== turn) return
      if (!chosen) {
        note(`skipped, no Swedish voice: ${label}`)
        return
      }

      if (synth.speaking || synth.pending) {
        synth.cancel()
        await sleep(CANCEL_SETTLE_MS)
        if (myTurn !== turn) return
      }
      // Chrome and Edge can get stuck paused (e.g. after the tab was in the background); harmless otherwise.
      synth.resume()

      const utterance = env.createUtterance(text)
      utterance.voice = chosen
      utterance.lang = chosen.lang
      utterance.rate = SPEECH_RATE
      currentUtterance = utterance

      await new Promise<void>((resolve) => {
        // Some browsers never fire 'end'; the game must never wait forever.
        const fallback = setTimeout(() => finish('no end event, gave up waiting'), 2000 + text.length * 150)
        function finish(how: string) {
          clearTimeout(fallback)
          note(`${how}: ${label}`)
          if (currentUtterance === utterance) currentUtterance = null
          resolve()
        }
        utterance.onstart = () => note(`started: ${label}`)
        utterance.onend = () => finish('finished')
        utterance.onerror = (event) => finish(`error "${event.error}"`)
        note(`speak with ${describeVoice(chosen)}: ${label}`)
        synth.speak(utterance)
      })
    },

    stop() {
      turn++
      if (env && (env.synth.speaking || env.synth.pending)) env.synth.cancel()
    },

    getStatus: () => status,

    getDebugInfo() {
      const voices = env?.synth.getVoices() ?? []
      return {
        status,
        chosenVoice: voice ? describeVoice(voice) : null,
        swedishVoices: voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('sv')).map(describeVoice),
        totalVoices: voices.length,
        events: [...events],
      }
    },

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
export const getSpeechDebugInfo = () => browserSpeech.getDebugInfo()
