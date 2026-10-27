import { createHash } from 'node:crypto'
import { getLetter } from '../src/content/letters'
import { phrases } from '../src/content/phrases'
import { getWord } from '../src/content/words'
import { getItem } from '../src/rewards/items'

/**
 * The ElevenLabs API, for `npm run speech` only (scripts/generate-speech.mjs): clips are made
 * once, stored as files and reused, and the game itself never calls ElevenLabs. The key is
 * ELEVENLABS_API_KEY from .env; it goes in one request header and is never printed.
 */
export const apiBase = 'https://api.elevenlabs.io/v1'

/** The key from the environment, or else from the text of a .env file. */
export function readApiKey(dotenv: string | undefined, env: Readonly<Record<string, string | undefined>>): string | undefined {
  const fromEnv = env.ELEVENLABS_API_KEY?.trim()
  if (fromEnv) return fromEnv
  for (const line of (dotenv ?? '').split(/\r?\n/)) {
    const match = /^\s*ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$/.exec(line)
    if (match) return match[1]!.replace(/^(["'])(.*)\1$/, '$2').trim() || undefined
  }
  return undefined
}

/** Flash and Turbo cost half a credit per character, the other models one (elevenlabs.io/pricing/api). */
export function creditsPerCharacter(model: string): number {
  return /flash|turbo/.test(model) ? 0.5 : 1
}

export function creditsFor(texts: readonly string[], model: string): number {
  return Math.ceil(texts.reduce((sum, text) => sum + [...text].length, 0) * creditsPerCharacter(model))
}

/**
 * Why a run may not spend `needed` credits, or null if it may. `cap` is --max-credits: a run
 * never spends more than it was allowed to, nor more than the month has left (`left`, when known).
 */
export function budgetProblem(needed: number, left: number | null, cap: number | undefined): string | null {
  if (cap === undefined) return `This needs about ${needed} credits. Run it again with --max-credits ${needed} (or more) to go ahead.`
  if (!(cap >= 0)) return `--max-credits must be a number.`
  if (needed > cap) return `This needs about ${needed} credits, more than --max-credits ${cap}.`
  if (left !== null && needed > left) return `This needs about ${needed} credits, but only ${left} are left this month.`
  return null
}

/**
 * Which clips ElevenLabs makes now, in order: as many as `budget` credits pay for, stopping at
 * the first that doesn't fit, so sentences that belong together stay in one voice. The rest are
 * said by the free voice until a later run (`stopgapVoice` in src/speech/voiceSettings.ts).
 */
export function withinBudget<T>(items: readonly T[], cost: (item: T) => number, budget: number): { now: T[]; later: T[] } {
  let spent = 0
  const first = items.findIndex((item) => (spent += cost(item)) > budget)
  const cut = first === -1 ? items.length : first
  return { now: items.slice(0, cut), later: items.slice(cut) }
}

/** A refused request, with ElevenLabs' own explanation. */
export class ElevenLabsError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

async function request(path: string, key: string, init: RequestInit, fetchFn: typeof fetch): Promise<Response> {
  const response = await fetchFn(`${apiBase}${path}`, { ...init, headers: { ...init.headers, 'xi-api-key': key } })
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: { message?: string; status?: string } | string }
      detail = typeof body.detail === 'string' ? body.detail : (body.detail?.message ?? body.detail?.status ?? detail)
    } catch {
      // Not JSON: the status text has to do.
    }
    throw new ElevenLabsError(response.status, `ElevenLabs refused ${init.method ?? 'GET'} ${path.split('?')[0]}: ${response.status} ${detail}`)
  }
  return response
}

/** Credits left this month, and when they renew. */
export async function creditsLeft(key: string, fetchFn: typeof fetch = fetch): Promise<{ left: number; resetsAt: Date | null }> {
  const body = (await (await request('/user/subscription', key, {}, fetchFn)).json()) as {
    character_count: number
    character_limit: number
    next_character_count_reset_unix?: number
  }
  const reset = body.next_character_count_reset_unix
  return { left: body.character_limit - body.character_count, resetsAt: reset ? new Date(reset * 1000) : null }
}

export interface AccountVoice {
  id: string
  name: string
  /** "premade" (ElevenLabs' own), "generated" (Voice Design), "cloned" … */
  category: string
  accent?: string
}

/** The voices this account can use. */
export async function accountVoices(key: string, fetchFn: typeof fetch = fetch): Promise<AccountVoice[]> {
  const body = (await (await request('/voices', key, {}, fetchFn)).json()) as {
    voices: { voice_id: string; name: string; category: string; labels?: { accent?: string } }[]
  }
  return body.voices.map((voice) => ({ id: voice.voice_id, name: voice.name, category: voice.category, accent: voice.labels?.accent }))
}

/**
 * ElevenLabs' own voices by their published IDs, for a key that may not list the account's
 * voices: one limited to text-to-speech, which is the safest kind (2026-10-25).
 */
export const defaultVoices: readonly AccountVoice[] = [
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', category: 'premade' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', category: 'premade' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'premade' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', category: 'premade' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', category: 'premade' },
]

/** By name; names may carry a description after the first word ("Charlotte - …"). */
export function findVoice(voices: readonly AccountVoice[], name: string): AccountVoice | undefined {
  const wanted = name.toLocaleLowerCase('sv')
  const first = (voice: AccountVoice) => voice.name.toLocaleLowerCase('sv').split(/[\s-]+/)[0]
  return voices.find((voice) => voice.name.toLocaleLowerCase('sv') === wanted) ?? voices.find((voice) => first(voice) === wanted)
}

export interface SynthesisVoice {
  voiceId: string
  model: string
  speed: number
  stability: number
  similarity: number
}

/** One sentence as MP3. The same `seed` gives (nearly) the same take again, says ElevenLabs. */
export async function synthesize(
  key: string,
  voice: SynthesisVoice,
  text: string,
  seed: number,
  fetchFn: typeof fetch = fetch,
): Promise<Uint8Array> {
  const body = {
    text,
    model_id: voice.model,
    voice_settings: { stability: voice.stability, similarity_boost: voice.similarity, style: 0, use_speaker_boost: true, speed: voice.speed },
    seed,
    // Only the v2.5 models take a language; the others hear that it is Swedish from the text.
    ...(voice.model.endsWith('_v2_5') ? { language_code: 'sv' } : {}),
  }
  const response = await request(
    `/text-to-speech/${encodeURIComponent(voice.voiceId)}?output_format=mp3_44100_128`,
    key,
    { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) },
    fetchFn,
  )
  return new Uint8Array(await response.arrayBuffer())
}

/** A folder name for a voice in the trial: "Matilda, Flash (sv)" → "matilda-flash-sv". */
export function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * A trial clip's file name: a hash of everything that shapes it (the voice, its settings and
 * what it is asked to say), so the same voice saying the same thing is made once and then
 * reused, like the game's clips: nothing is paid for twice.
 */
export function sampleName(shapedBy: readonly unknown[]): string {
  return `${createHash('sha1').update(JSON.stringify(shapedBy)).digest('hex').slice(0, 10)}.mp3`
}

/** What shapes an ElevenLabs trial clip. */
export function elevenLabsSampleName(voice: SynthesisVoice, input: string): string {
  return sampleName([voice.voiceId, voice.model, voice.speed, voice.stability, voice.similarity, input])
}

/** The free plan turns away requests that come too fast (429): wait a little longer each time, then try again. */
export async function withRetries<T>(
  task: () => Promise<T>,
  waits: readonly number[] = [3000, 8000, 20000],
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await task()
    } catch (error) {
      const wait = waits[attempt]
      if (!(error instanceof ElevenLabsError) || error.status !== 429 || wait === undefined) throw error
      await sleep(wait)
    }
  }
}

/**
 * What the trial says in every voice: a long instruction, questions with a pause, a lone
 * word and a lone letter (where voices most often go wrong), an item and Bygg ordet.
 * All of them are game sentences, so Alma's clip sits next to each.
 */
export function trialSentences(): string[] {
  return [
    phrases.hubWelcome,
    phrases.dragonQuestion(getLetter('o-umlaut').spoken),
    phrases.wordPictureQuestion(getWord('tiger').definite),
    phrases.firstLetterQuestion(getWord('butterfly').base),
    phrases.firstLetterShort(getWord('monkey').base),
    phrases.firstLetterShort(getWord('ear').base),
    phrases.letterShort(getLetter('m').spoken),
    phrases.thatIs(getLetter('n').spoken),
    phrases.itemUnlocked(getItem('viking-helmet').indefinite),
    phrases.spellingQuestion(getWord('fox').base),
  ]
}
