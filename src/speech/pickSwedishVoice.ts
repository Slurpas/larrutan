export interface VoiceLike {
  name: string
  lang: string
}

/** Edge's online "Natural" voices and iPad's downloadable "Enhanced"/"Premium" voices sound clearly better. */
const QUALITY_HINTS = /natural|neural|premium|enhanced/i

/**
 * Picks the best Swedish voice from what the device offers, or undefined if
 * there is none. Swedish from Sweden beats other Swedish; higher-quality
 * voices beat basic ones.
 */
export function pickSwedishVoice<V extends VoiceLike>(voices: readonly V[]): V | undefined {
  let best: V | undefined
  let bestScore = 0
  for (const voice of voices) {
    const score = scoreVoice(voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}

function scoreVoice(voice: VoiceLike): number {
  // Android reports "sv_SE" instead of "sv-SE".
  const lang = voice.lang.replace('_', '-').toLowerCase()
  if (lang !== 'sv' && !lang.startsWith('sv-')) return 0

  let score = lang === 'sv-se' ? 10 : lang === 'sv' ? 8 : 5
  if (QUALITY_HINTS.test(voice.name)) score += 2
  else if (/google/i.test(voice.name)) score += 1
  return score
}
