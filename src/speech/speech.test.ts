import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpeech, type SpeechEnv, type VoiceStatus } from './speech'

const swedish = { name: 'Alva', lang: 'sv-SE' } as SpeechSynthesisVoice
const english = { name: 'Samantha', lang: 'en-US' } as SpeechSynthesisVoice

/** A pretend device whose voice list can change later, like iPad Safari's, without any event. */
function fakeDevice() {
  const device = {
    voices: [] as SpeechSynthesisVoice[],
    spoken: [] as SpeechSynthesisUtterance[],
  }
  const env: SpeechEnv = {
    synth: {
      getVoices: () => device.voices,
      speak: (utterance) => {
        device.spoken.push(utterance)
        setTimeout(() => utterance.onend?.({} as SpeechSynthesisEvent), 10)
      },
      cancel: () => {},
      addEventListener: () => {},
    },
    createUtterance: (text) => ({ text, voice: null, lang: '', rate: 1, volume: 1 }) as unknown as SpeechSynthesisUtterance,
  }
  return { device, env }
}

function recordStatuses(speech: ReturnType<typeof createSpeech>): VoiceStatus[] {
  const seen: VoiceStatus[] = []
  speech.subscribe(() => seen.push(speech.getStatus()))
  return seen
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('speech voice detection', () => {
  it('finds a Swedish voice that shows up late without any event (iPad Safari)', async () => {
    const { device, env } = fakeDevice()
    const speech = createSpeech(env)
    const statuses = recordStatuses(speech)
    speech.init()
    expect(speech.getStatus()).toBe('loading')

    await vi.advanceTimersByTimeAsync(3000)
    device.voices = [english, swedish]
    await vi.advanceTimersByTimeAsync(600)

    expect(speech.getStatus()).toBe('ready')
    expect(statuses).toEqual(['ready']) // the "no Swedish voice" warning never flashed
  })

  it('recovers when the voice arrives after it had given up', async () => {
    const { device, env } = fakeDevice()
    const speech = createSpeech(env)
    speech.init()

    await vi.advanceTimersByTimeAsync(5100)
    expect(speech.getStatus()).toBe('missing')

    device.voices = [swedish]
    await vi.advanceTimersByTimeAsync(600)
    expect(speech.getStatus()).toBe('ready')
  })

  it('lets speech asked for while voices load wait, then use the Swedish voice', async () => {
    const { device, env } = fakeDevice()
    const speech = createSpeech(env)
    speech.init()

    const done = speech.speak('Tryck på en skylt för att spela!')
    await vi.advanceTimersByTimeAsync(300)
    device.voices = [swedish]
    await vi.advanceTimersByTimeAsync(500)
    await done

    expect(device.spoken).toHaveLength(1)
    expect(device.spoken[0]?.voice).toBe(swedish)
    expect(device.spoken[0]?.lang).toBe('sv-SE')
  })

  it('reports a missing voice at once when the device only has other languages, without slowing the game', async () => {
    const { device, env } = fakeDevice()
    device.voices = [english]
    const speech = createSpeech(env)
    speech.init()
    expect(speech.getStatus()).toBe('missing')

    let finished = false
    void speech.speak('Rätt!').then(() => (finished = true))
    await vi.advanceTimersByTimeAsync(0)
    expect(finished).toBe(true)
    expect(device.spoken).toHaveLength(0)
  })

  it('never speaks in another language', async () => {
    const { device, env } = fakeDevice()
    device.voices = [english]
    const speech = createSpeech(env)
    speech.init()
    await speech.speak('Var är A?')
    expect(device.spoken).toHaveLength(0)
  })

  it('copes with browsers that have no speech at all', async () => {
    const speech = createSpeech(null)
    speech.init()
    expect(speech.getStatus()).toBe('missing')
    await expect(speech.speak('Hej')).resolves.toBeUndefined()
  })
})
