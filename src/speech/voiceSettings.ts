/**
 * The voice the clips are generated with (`npm run speech`, PRD §7). Part of every
 * clip's file name, so changing anything here gives every clip a new name: the old
 * audio can never be played from a cache, and each approval belongs to the audio it was given for.
 */
export interface SpeechVoice {
  engine: string
  voice: string
  /** Above 1 speaks more slowly. */
  lengthScale: number
}

/** Alma: a female Swedish voice (CC BY 4.0, NST dataset). Her natural pace is quick, so she is slowed down for young listeners. */
export const speechVoice: SpeechVoice = {
  engine: 'Piper (piper-tts 1.8.0)',
  voice: 'sv_SE-alma-medium',
  lengthScale: 1.2,
}
