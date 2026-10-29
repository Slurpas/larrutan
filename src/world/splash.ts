import { outfitFeetRow, outfitHeadTop, outfitSize } from '../art/outfit'
import { TILE } from './camera'

/**
 * Falling into the water, a quick joke (the user's idea, 2026-10-29): the character hops in
 * from the bank, splashes and sinks, two bubbles pop, the head bobs up, and it climbs back
 * out. Pure: the pose at each moment, so the scene only draws it, on the real clock.
 */

/** When each part ends, in milliseconds from the start of the hop. */
const landed = 260
const sunk = landed + 200
const surfacing = sunk + 400
const surfaced = surfacing + 300
const bobbed = surfaced + 400
const risen = bobbed + 140
export const splashDuration = risen + 300

/** The water's surface, in pixels below the middle of the tile (the character's feet are at its bottom). */
export const waterline = 2
const feet = TILE / 2

/** How far down the sprite goes before nothing of it shows above the water, tall hats included. */
const underSink = waterline - feet + outfitFeetRow + 1
/** Only the head above the water, to the chin (src/art/character.ts). */
const headSink = underSink - (outfitHeadTop + 12)

export interface SplashPose {
  /** How far along from the bank to the water tile: 0 to 1. */
  along: number
  /** Pixels up, for the arc of a hop. */
  lift: number
  /** Pixels down into the water. */
  sink: number
  /** How many rows of the sprite, from its top, show above the water; null on land (all of it). */
  shown: number | null
  /** Which way the character looks: at the water on the way in, at the child once it bobs up, at the bank on the way out. */
  looks: 'water' | 'front' | 'bank'
}

/** What happens on the way, and when: the splash as it lands, two bubbles while it is under, a ring as it comes up. */
export type SplashEffect = { at: number; effect: 'splash' | 'ripple' } | { at: number; effect: 'bubble'; dx: number }
export const splashEffects: readonly SplashEffect[] = [
  { at: landed, effect: 'splash' },
  { at: sunk + 120, effect: 'bubble', dx: -3 },
  { at: sunk + 300, effect: 'bubble', dx: 3 },
  { at: surfacing + 80, effect: 'ripple' },
]

const arc = (p: number, height: number) => Math.round(height * Math.sin(Math.PI * p))
/** Up past the goal and back, for popping up out of the water. */
const backOut = (p: number) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2

function wet(sink: number, looks: SplashPose['looks']): SplashPose {
  return { along: 1, lift: 0, sink, shown: Math.max(0, Math.min(outfitSize.height, underSink - sink)), looks }
}

export function splashPose(elapsed: number): SplashPose {
  const t = Math.max(0, Math.min(elapsed, splashDuration))
  const progress = (from: number, to: number) => (t - from) / (to - from)
  if (t < landed) {
    const p = progress(0, landed)
    return { along: p, lift: arc(p, 6), sink: 0, shown: null, looks: 'water' }
  }
  if (t < sunk) return wet(Math.round(underSink * progress(landed, sunk) ** 2), 'water')
  if (t < surfacing) return wet(underSink, 'water')
  if (t < surfaced) return wet(Math.round(underSink + (headSink - underSink) * backOut(progress(surfacing, surfaced))), 'front')
  // Bobbing twice, a pixel or two.
  if (t < bobbed) return wet(headSink + Math.round(0.75 * (1 - Math.cos(4 * Math.PI * progress(surfaced, bobbed)))), 'front')
  if (t < risen) return wet(Math.round(headSink * (1 - progress(bobbed, risen))), 'front')
  const p = progress(risen, splashDuration)
  return { along: 1 - p, lift: arc(p, 7), sink: 0, shown: null, looks: 'bank' }
}
