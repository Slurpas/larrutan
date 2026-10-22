import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSpeech, type SpeechEnv, type VoiceStatus } from './speech'

const swedish = { name: 'Alva', lang: 'sv-SE' } as SpeechSynthesisVoice
const english = { name: 'Samantha', lang: 'en-US' } as SpeechSynthesisVoice

/** A pretend device whose voice list can change later, like iPad Safari's, without any event. */
function fakeDevice() {
  const device = {
    voices: [] as SpeechSynthesisVoice[],
    spoken: [] as SpeechSynthesisUtterance[],
    cancels: 0,
    busy: false,
  }
  const env: SpeechEnv = {
    synth: {
      getVoices: () => device.voices,
      speak: (utterance) => {
        device.spoken.push(utterance)
        device.busy = true
        setTimeout(() => {
          device.busy = false
          utterance.onend?.({} as SpeechSynthesisEvent)
        }, 1000)
      },
      cancel: () => {
        device.cancels++
        device.busy = false
      },
      resume: () => {},
      get speaking() {
        return device.busy
      },
      get pending() {
        return false
      },
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
    await vi.advanceTimersByTimeAsync(2000)
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

  it('only says the newest of several quick requests', async () => {
    const { device, env } = fakeDevice()
    device.voices = [swedish]
    const speech = createSpeech(env)
    speech.init()

    void speech.speak('Var är A?')
    void speech.speak('Det där är S. Var är A?')
    void speech.speak('Här är A!')
    await vi.advanceTimersByTimeAsync(3000)

    expect(device.spoken.map((u) => u.text).at(-1)).toBe('Här är A!')
    expect(device.spoken.map((u) => u.text)).not.toContain('Det där är S. Var är A?')
  })

  it('cancels only when something is playing, then waits a moment before the next sentence', async () => {
    const { device, env } = fakeDevice()
    device.voices = [swedish]
    const speech = createSpeech(env)
    speech.init()

    void speech.speak('Rätt!')
    await vi.advanceTimersByTimeAsync(0)
    expect(device.cancels).toBe(0)
    expect(device.spoken).toHaveLength(1)

    void speech.speak('Var är M?')
    await vi.advanceTimersByTimeAsync(0)
    expect(device.cancels).toBe(1)
    expect(device.spoken).toHaveLength(1) // not yet: settling after the cancel
    await vi.advanceTimersByTimeAsync(200)
    expect(device.spoken.at(-1)?.text).toBe('Var är M?')
  })

  it('stops a sentence that is still waiting when the child leaves', async () => {
    const { device, env } = fakeDevice()
    const speech = createSpeech(env)
    speech.init()

    void speech.speak('Var är A?') // voices still loading, so it waits
    speech.stop()
    device.voices = [swedish]
    await vi.advanceTimersByTimeAsync(2000)
    expect(device.spoken).toHaveLength(0)
  })

  it('keeps a log for the diagnostic panel', async () => {
    const { device, env } = fakeDevice()
    device.voices = [english, swedish]
    const speech = createSpeech(env)
    speech.init()
    void speech.speak('Hej!')
    await vi.advanceTimersByTimeAsync(1500)

    const info = speech.getDebugInfo()
    expect(info.chosenVoice).toMatch(/Alva/)
    expect(info.swedishVoices).toHaveLength(1)
    expect(info.totalVoices).toBe(2)
    expect(info.events.join('\n')).toMatch(/finished: "Hej!"/)
  })

  it('copes with browsers that have no speech at all', async () => {
    const speech = createSpeech(null)
    speech.init()
    expect(speech.getStatus()).toBe('missing')
    await expect(speech.speak('Hej')).resolves.toBeUndefined()
  })
})
