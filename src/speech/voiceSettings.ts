/**
 * The voice the clips are generated with (`npm run speech`, PRD §7). Part of every
 * clip's file name, so changing anything here gives every clip a new name: the old
 * audio can never be played from a cache, and each approval belongs to the audio it was given for.
 */
export type SpeechVoice = PiperVoice | ElevenLabsVoice

/** Piper: free and offline, installed in `.tools/` (see README). */
export interface PiperVoice {
  engine: `Piper ${string}`
  voice: string
  /** Above 1 speaks more slowly. */
  lengthScale: number
  /** Silence where the speech input has a pause mark ("Var är … Å?"). */
  pauseSeconds: number
}

export type ElevenLabsModel = 'eleven_multilingual_v2' | 'eleven_v3' | 'eleven_flash_v2_5' | 'eleven_turbo_v2_5'

/**
 * ElevenLabs (elevenlabs.io), through its API with ELEVENLABS_API_KEY from .env: only when
 * clips are made, never while the game runs. The free plan gives 10,000 characters a month,
 * for non-commercial use, and published clips must credit "elevenlabs.io".
 */
export interface ElevenLabsVoice {
  engine: 'ElevenLabs'
  /** The voice's name in ElevenLabs, for people. */
  voice: string
  voiceId: string
  model: ElevenLabsModel
  /** 0.7–1.2: below 1 speaks more slowly. */
  speed: number
  stability: number
  similarity: number
  /** The pause where the speech input has a pause mark, as a break inside the sentence. */
  pauseSeconds: number
}

/**
 * Alma: a female Swedish voice (CC BY 4.0, NST dataset). Her natural pace is quick, so she is
 * slowed down for young listeners: 1.4 was picked by ear on 2026-10-23 (1.2 was too fast).
 */
export const speechVoice: SpeechVoice = {
  engine: 'Piper (piper-tts 1.8.0)',
  voice: 'sv_SE-alma-medium',
  lengthScale: 1.4,
  pauseSeconds: 0.15,
}

/** An ElevenLabs voice to compare with the current one, found by its name among the account's voices. */
export interface TrialVoice {
  label: string
  name: string
  model: ElevenLabsModel
}

/**
 * The ElevenLabs trial (`npm run speech -- --samples`, the user's request 2026-10-25): a few
 * sentences in each of these voices, next to Alma's. Free accounts can only use ElevenLabs'
 * own voices through the API, or one made with its Voice Design: Charlotte, listed with a
 * Swedish accent, is a library voice and was refused (402). Flash takes a language, so it is
 * told the text is Swedish. Not used by the game.
 */
export const trialVoices: readonly TrialVoice[] = [
  { label: 'Matilda', name: 'Matilda', model: 'eleven_multilingual_v2' },
  { label: 'Sarah', name: 'Sarah', model: 'eleven_multilingual_v2' },
  { label: 'Lily', name: 'Lily', model: 'eleven_multilingual_v2' },
  { label: 'Matilda, Flash (sv)', name: 'Matilda', model: 'eleven_flash_v2_5' },
]

/** Every trial voice speaks a little slower than normal, for young listeners. */
export const trialSettings = { speed: 0.85, stability: 0.5, similarity: 0.75, pauseSeconds: 0.4 } as const
