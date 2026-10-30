import { outfitFeetRow, outfitHeadTop, outfitSize, type CharacterFacing } from '../art/outfit'
import { TILE } from './camera'
import type { Direction } from './tileMap'

/**
 * Little accidents on the map, each a quick joke (the user's ideas): walking into the water,
 * the character falls in and climbs back out (2026-10-29); into a tree, it bonks its head and
 * sees stars; over a rock, it trips and falls flat (2026-10-30). Pure: the pose at each moment,
 * so the scene only draws it, on the real clock.
 */
export type Mishap = 'splash' | 'bonk' | 'trip'

export interface MishapPose {
  /** How far towards the obstacle: 0 on the character's own tile, 1 on the obstacle's (in the water). */
  along: number
  /** Pixels up, for hops. */
  lift: number
  /** Pixels down into the water. */
  sink: number
  /** How many rows of the sprite, from its top, show above the water; null on land (all of it). */
  shown: number | null
  /** Degrees clockwise around the feet: lying flat after a trip. */
  angle: number
  /** Pixels sideways: dizzy. */
  wobble: number
  facing: CharacterFacing
  /** Stepping (walk frames) rather than standing still. */
  walking: boolean
  /** Stars circling the head after a bonk: how far round they are, in radians; null when there are none. */
  stars: number | null
}

/** What happens on the way, and when (ms): a sound, with drops, bubbles, rings or dust. */
export type MishapEffect = { at: number; effect: 'splash' | 'ripple' | 'bonk' | 'thud' } | { at: number; effect: 'bubble'; dx: number }

/** The water's surface, in pixels below the middle of the tile (the character's feet are at its bottom). */
export const waterline = 2

const facingOf: Record<Direction, CharacterFacing> = { up: 'up', down: 'down', left: 'left', right: 'side' }
const opposite: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }

const arc = (p: number, height: number) => Math.round(height * Math.sin(Math.PI * p))
/** Up past the goal and back, for popping up out of the water. */
const backOut = (p: number) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2
/** Side to side, a pixel each way, `times` a second. */
const sway = (ms: number, times: number) => Math.round(Math.sin((2 * Math.PI * times * ms) / 1000))

interface Timeline {
  duration: number
  effects: readonly MishapEffect[]
  pose: (t: number, ahead: CharacterFacing, back: CharacterFacing, direction: Direction) => Partial<MishapPose>
}

// --- Into the water ---------------------------------------------------------

const landed = 260
const sunk = landed + 200
const surfacing = sunk + 400
const surfaced = surfacing + 300
const bobbed = surfaced + 400
const risen = bobbed + 140
/** How far down the sprite goes before nothing of it shows above the water, tall hats included. */
const underSink = waterline - TILE / 2 + outfitFeetRow + 1
/** Only the head above the water, to the chin (src/art/character.ts). */
const headSink = underSink - (outfitHeadTop + 12)
const wet = (sink: number, facing: CharacterFacing): Partial<MishapPose> => ({
  along: 1,
  sink,
  shown: Math.max(0, Math.min(outfitSize.height, underSink - sink)),
  facing,
})

/** It hops in from the bank, splashes and sinks, two bubbles pop, the head bobs up, and it climbs back out. */
const splash: Timeline = {
  duration: risen + 300,
  effects: [
    { at: landed, effect: 'splash' },
    { at: sunk + 120, effect: 'bubble', dx: -3 },
    { at: sunk + 300, effect: 'bubble', dx: 3 },
    { at: surfacing + 80, effect: 'ripple' },
  ],
  pose(t, ahead, back) {
    const progress = (from: number, to: number) => (t - from) / (to - from)
    if (t < landed) return { along: progress(0, landed), lift: arc(progress(0, landed), 6), facing: ahead }
    if (t < sunk) return wet(Math.round(underSink * progress(landed, sunk) ** 2), ahead)
    if (t < surfacing) return wet(underSink, ahead)
    if (t < surfaced) return wet(Math.round(underSink + (headSink - underSink) * backOut(progress(surfacing, surfaced))), 'down')
    // Bobbing twice, a pixel or two.
    if (t < bobbed) return wet(headSink + Math.round(0.75 * (1 - Math.cos(4 * Math.PI * progress(surfaced, bobbed)))), 'down')
    if (t < risen) return wet(Math.round(headSink * (1 - progress(bobbed, risen))), 'down')
    const p = Math.min(1, progress(risen, risen + 300))
    return { along: 1 - p, lift: arc(p, 7), facing: back }
  },
}

// --- Into a tree ------------------------------------------------------------

const hit = 160
const bounced = hit + 260
const dizzy = bounced + 900
/** How far it gets before its head meets the trunk, in tiles. */
const reach = 0.3

/** It walks into the trunk (bonk!), bounces back, and stands there dizzy with stars circling its head. */
const bonk: Timeline = {
  duration: dizzy + 200,
  effects: [{ at: hit, effect: 'bonk' }],
  pose(t, ahead) {
    const progress = (from: number, to: number) => (t - from) / (to - from)
    const stars = t >= hit && t < dizzy ? 5 * Math.PI * progress(hit, dizzy) : null
    if (t < hit) return { along: reach * progress(0, hit), facing: ahead, walking: true }
    if (t < bounced) return { along: reach * (1 - progress(hit, bounced)), lift: arc(progress(hit, bounced), 4), facing: ahead, stars }
    if (t < dizzy) return { wobble: sway(t - bounced, 2.5), facing: 'down', stars }
    // Shaking it off with a little hop.
    return { lift: arc(Math.min(1, progress(dizzy, dizzy + 200)), 2), facing: 'down' }
  },
}

// --- Over a rock ------------------------------------------------------------

const stumbled = 180
const fallen = stumbled + 220
const lain = fallen + 600
const up = lain + 260
/** Which way it falls, and which way it is seen lying: forward over the rock (towards the child: on its front, the back showing). */
const fall: Record<Direction, { angle: number; facing: CharacterFacing }> = {
  right: { angle: 90, facing: 'side' },
  left: { angle: -90, facing: 'left' },
  down: { angle: 180, facing: 'up' },
  up: { angle: 90, facing: 'side' },
}

/** It walks onto the rock, trips and falls flat over it (thud), lies there a moment, then hops up and back, a bit wobbly. */
const trip: Timeline = {
  duration: up + 300,
  effects: [{ at: fallen, effect: 'thud' }],
  pose(t, ahead, _back, direction) {
    const progress = (from: number, to: number) => (t - from) / (to - from)
    const { angle, facing } = fall[direction]
    if (t < stumbled) return { along: 0.35 * progress(0, stumbled), facing: ahead, walking: true }
    if (t < fallen) {
      const p = progress(stumbled, fallen)
      return { along: 0.35 + 0.1 * p, angle: Math.round(angle * p * p), facing }
    }
    if (t < lain) return { along: 0.45, angle, facing }
    if (t < up) {
      const p = progress(lain, up)
      return { along: 0.45 * (1 - p), angle: Math.round(angle * (1 - p) ** 2), lift: arc(p, 3), facing: p < 0.5 ? facing : 'down' }
    }
    return { wobble: sway(t - up, 3), facing: 'down' }
  },
}

const timelines: Record<Mishap, Timeline> = { splash, bonk, trip }

export function mishapDuration(mishap: Mishap): number {
  return timelines[mishap].duration
}

export function mishapEffects(mishap: Mishap): readonly MishapEffect[] {
  return timelines[mishap].effects
}

/** The character `elapsed` ms into a mishap, walking `direction` into the obstacle. At the end it stands on its own tile again. */
export function mishapPose(mishap: Mishap, elapsed: number, direction: Direction): MishapPose {
  const { duration, pose } = timelines[mishap]
  const t = Math.max(0, Math.min(elapsed, duration))
  const ahead = facingOf[direction]
  const back = facingOf[opposite[direction]]
  const still: MishapPose = { along: 0, lift: 0, sink: 0, shown: null, angle: 0, wobble: 0, facing: ahead, walking: false, stars: null }
  return t >= duration ? { ...still, ...pose(duration, ahead, back, direction), along: 0, lift: 0, wobble: 0, walking: false, stars: null } : { ...still, ...pose(t, ahead, back, direction) }
}
