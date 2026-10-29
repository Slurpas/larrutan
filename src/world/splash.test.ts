import { describe, expect, it } from 'vitest'
import { outfitHeadTop } from '../art/outfit'
import { splashDuration, splashEffects, splashPose } from './splash'

const times = Array.from({ length: Math.ceil(splashDuration / 10) + 1 }, (_, i) => i * 10)
const poses = times.map((t) => ({ t, ...splashPose(t) }))

describe('falling into the water', () => {
  it('is a quick joke: over in about two seconds, starting and ending on the bank, all of the character showing', () => {
    expect(splashDuration).toBeGreaterThan(1500)
    expect(splashDuration).toBeLessThan(2500)
    for (const t of [0, splashDuration, splashDuration + 1000]) expect(splashPose(t)).toMatchObject({ along: 0, lift: 0, sink: 0, shown: null })
  })

  it('hops into the water, goes all the way under, and comes back up with its head above the water, looking at the child', () => {
    const wet = poses.filter((p) => p.shown !== null)
    expect(wet.length).toBeGreaterThan(0)
    for (const p of wet) expect(p.along).toBe(1)
    expect(wet.some((p) => p.shown === 0)).toBe(true)
    const firstUnder = wet.findIndex((p) => p.shown === 0)
    const head = wet.slice(firstUnder).filter((p) => p.shown! > 0)
    expect(head.length).toBeGreaterThan(0)
    expect(head.some((p) => p.looks === 'front' && p.shown! > outfitHeadTop + 8)).toBe(true)
    // In whole pixels, for pixel art.
    for (const p of poses) {
      expect(Number.isInteger(p.lift) && Number.isInteger(p.sink)).toBe(true)
      if (p.shown !== null) expect(Number.isInteger(p.shown)).toBe(true)
    }
  })

  it('arcs up on each hop, and looks at the water going in and at the bank coming out', () => {
    const dry = poses.filter((p) => p.shown === null && p.t > 0 && p.t < splashDuration)
    const goingIn = dry.filter((p) => p.looks === 'water')
    const comingOut = dry.filter((p) => p.looks === 'bank')
    expect(Math.max(...goingIn.map((p) => p.lift))).toBeGreaterThan(3)
    expect(Math.max(...comingOut.map((p) => p.lift))).toBeGreaterThan(3)
    expect(goingIn.every((p) => p.t < comingOut[0]!.t)).toBe(true)
  })

  it('splashes as it lands in the water, bubbles while it is under, and rings the water as it comes up', () => {
    const landed = poses.find((p) => p.shown !== null)!.t
    const [splash, ...rest] = splashEffects
    expect(splash!.effect).toBe('splash')
    expect(Math.abs(splash!.at - landed)).toBeLessThanOrEqual(10)
    for (const bubble of rest.filter((e) => e.effect === 'bubble')) expect(splashPose(bubble.at).shown).toBe(0)
    const ring = rest.find((e) => e.effect === 'ripple')!
    expect(splashPose(ring.at).looks).toBe('front')
    for (const e of splashEffects) expect(e.at).toBeLessThan(splashDuration)
  })
})
