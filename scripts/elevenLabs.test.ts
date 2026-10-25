import { describe, expect, it } from 'vitest'
import { spokenTexts } from '../src/speech/catalogue'
import {
  ElevenLabsError,
  accountVoices,
  apiBase,
  budgetProblem,
  creditsFor,
  creditsLeft,
  findVoice,
  elevenLabsSampleName,
  sampleName,
  slug,
  readApiKey,
  synthesize,
  trialSentences,
  withRetries,
} from './elevenLabs'

/** A stand-in for fetch: records each request and answers with `reply`. No network. */
function fakeFetch(reply: () => Response) {
  const calls: { url: string; init: RequestInit }[] = []
  const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    return reply()
  }) as typeof fetch
  return { fetchFn, calls }
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('the API key', () => {
  it('comes from the environment first, then from .env, quotes and spaces removed', () => {
    expect(readApiKey('ELEVENLABS_API_KEY=from-file', { ELEVENLABS_API_KEY: ' from-env ' })).toBe('from-env')
    expect(readApiKey('# a comment\nGEMINI_API_KEY=other\nELEVENLABS_API_KEY = "abc123" \n', {})).toBe('abc123')
    expect(readApiKey("ELEVENLABS_API_KEY='xyz'\r\n", {})).toBe('xyz')
  })

  it('is missing when it is absent or empty', () => {
    expect(readApiKey(undefined, {})).toBeUndefined()
    expect(readApiKey('ELEVENLABS_API_KEY=\nGEMINI_API_KEY=x', {})).toBeUndefined()
  })
})

describe('credits', () => {
  it('cost one per character, half for Flash and Turbo', () => {
    expect(creditsFor(['Apa.', 'Öra.'], 'eleven_multilingual_v2')).toBe(8)
    expect(creditsFor(['Apa.', 'Öra.'], 'eleven_flash_v2_5')).toBe(4)
    expect(creditsFor(['Å.'], 'eleven_turbo_v2_5')).toBe(1)
  })

  it('are never spent beyond --max-credits or what the month has left, and a run must name its cap', () => {
    expect(budgetProblem(500, 9000, 1000)).toBeNull()
    expect(budgetProblem(500, null, 1000)).toBeNull()
    expect(budgetProblem(500, 9000, undefined)).toMatch(/--max-credits 500/)
    expect(budgetProblem(1500, 9000, 1000)).toMatch(/more than --max-credits 1000/)
    expect(budgetProblem(500, 300, 1000)).toMatch(/only 300 are left/)
    expect(budgetProblem(500, 300, Number.NaN)).toMatch(/must be a number/)
  })

  it('left this month are read from the account, with the key in a header only', async () => {
    const { fetchFn, calls } = fakeFetch(() =>
      json({ character_count: 1200, character_limit: 10000, next_character_count_reset_unix: 1_800_000_000 }),
    )
    const result = await creditsLeft('secret-key', fetchFn)
    expect(result.left).toBe(8800)
    expect(result.resetsAt?.getTime()).toBe(1_800_000_000_000)
    expect(calls[0]!.url).toBe(`${apiBase}/user/subscription`)
    expect(new Headers(calls[0]!.init.headers).get('xi-api-key')).toBe('secret-key')
    expect(calls[0]!.url).not.toContain('secret-key')
  })
})

describe('voices', () => {
  it("are the account's own, found by name even with a description after it", async () => {
    const { fetchFn } = fakeFetch(() =>
      json({
        voices: [
          { voice_id: 'v1', name: 'Charlotte', category: 'premade', labels: { accent: 'swedish' } },
          { voice_id: 'v2', name: 'Sarah - soft and warm', category: 'premade' },
        ],
      }),
    )
    const voices = await accountVoices('k', fetchFn)
    expect(voices[0]).toEqual({ id: 'v1', name: 'Charlotte', category: 'premade', accent: 'swedish' })
    expect(findVoice(voices, 'charlotte')?.id).toBe('v1')
    expect(findVoice(voices, 'Sarah')?.id).toBe('v2')
    expect(findVoice(voices, 'Matilda')).toBeUndefined()
  })
})

describe('synthesis', () => {
  const voice = { voiceId: 'v1', model: 'eleven_multilingual_v2', speed: 0.85, stability: 0.5, similarity: 0.75 }

  it('asks for an MP3 of the text with the voice settings and a seed', async () => {
    const { fetchFn, calls } = fakeFetch(() => new Response(new Uint8Array([1, 2, 3])))
    const audio = await synthesize('k', voice, 'Var är, <break time="0.4s" /> tigern?', 42, fetchFn)
    expect([...audio]).toEqual([1, 2, 3])
    expect(calls[0]!.url).toBe(`${apiBase}/text-to-speech/v1?output_format=mp3_44100_128`)
    expect(calls[0]!.init.method).toBe('POST')
    const body = JSON.parse(String(calls[0]!.init.body))
    expect(body).toMatchObject({ text: 'Var är, <break time="0.4s" /> tigern?', model_id: 'eleven_multilingual_v2', seed: 42 })
    expect(body.voice_settings).toMatchObject({ speed: 0.85, stability: 0.5, similarity_boost: 0.75 })
    expect(body).not.toHaveProperty('language_code')
  })

  it('tells Flash and Turbo that the text is Swedish', async () => {
    const { fetchFn, calls } = fakeFetch(() => new Response(new Uint8Array([1])))
    await synthesize('k', { ...voice, model: 'eleven_flash_v2_5' }, 'Apa.', 1, fetchFn)
    expect(JSON.parse(String(calls[0]!.init.body)).language_code).toBe('sv')
  })

  it("passes on ElevenLabs' own explanation when it refuses, never the key", async () => {
    const { fetchFn } = fakeFetch(() => json({ detail: { status: 'quota_exceeded', message: 'You have 12 credits left.' } }, 401))
    const refusal = synthesize('secret-key', voice, 'Apa.', 1, fetchFn)
    await expect(refusal).rejects.toThrow(/401 You have 12 credits left/)
    await expect(synthesize('secret-key', voice, 'Apa.', 1, fetchFn)).rejects.not.toThrow(/secret-key/)
  })

  it('tries again after "too many requests", waiting longer each time, and gives up on anything else', async () => {
    const waited: number[] = []
    const sleep = async (ms: number) => void waited.push(ms)
    let attempts = 0
    const flaky = async () => {
      attempts++
      if (attempts < 3) throw new ElevenLabsError(429, 'too many requests')
      return 'done'
    }
    expect(await withRetries(flaky, [10, 20, 30], sleep)).toBe('done')
    expect(waited).toEqual([10, 20])
    await expect(withRetries(async () => Promise.reject(new ElevenLabsError(401, 'bad key')), [10], sleep)).rejects.toThrow('bad key')
  })
})

describe('the trial', () => {
  const voice = { voiceId: 'v1', model: 'eleven_multilingual_v2', speed: 0.85, stability: 0.5, similarity: 0.75 }

  it('keeps each clip under a name made from everything that shapes it, so it is made only once', () => {
    expect(elevenLabsSampleName(voice, 'Apa.')).toBe(elevenLabsSampleName({ ...voice }, 'Apa.'))
    expect(elevenLabsSampleName(voice, 'Apa.')).toMatch(/^[0-9a-f]{10}\.mp3$/)
    expect(elevenLabsSampleName(voice, 'Öra.')).not.toBe(elevenLabsSampleName(voice, 'Apa.'))
    expect(elevenLabsSampleName({ ...voice, model: 'eleven_flash_v2_5' }, 'Apa.')).not.toBe(elevenLabsSampleName(voice, 'Apa.'))
    expect(elevenLabsSampleName({ ...voice, speed: 0.9 }, 'Apa.')).not.toBe(elevenLabsSampleName(voice, 'Apa.'))
    // The names of clips made before stay the same (the Matilda and Sarah clips were moved, not remade).
    expect(elevenLabsSampleName(voice, 'Apa.')).toBe(sampleName(['v1', 'eleven_multilingual_v2', 0.85, 0.5, 0.75, 'Apa.']))
    expect(slug('Matilda, Flash (sv)')).toBe('matilda-flash-sv')
  })

  it('only says sentences the game says, so each sits next to Alma\'s clip', () => {
    const catalogue = new Set(spokenTexts())
    for (const sentence of trialSentences()) expect(catalogue.has(sentence), sentence).toBe(true)
    expect(trialSentences()).toHaveLength(10)
  })
})
