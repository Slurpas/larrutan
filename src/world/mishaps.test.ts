import { describe, expect, it } from 'vitest'
import { outfitHeadTop } from '../art/outfit'
import { mishapDuration, mishapEffects, mishapPose, type Mishap, type MishapPose } from './mishaps'
import type { Direction } from './tileMap'

const mishaps: Mishap[] = ['splash', 'bonk', 'trip']
const directions: Direction[] = ['up', 'down', 'left', 'right']
const posesOf = (mishap: Mishap, direction: Direction = 'right') =>
  Array.from({ length: Math.ceil(mishapDuration(mishap) / 10) + 1 }, (_, i) => ({ t: i * 10, ...mishapPose(mishap, i * 10, direction) }))

describe.each(mishaps)('the %s', (mishap) => {
  it('is a quick joke, starting and ending on the character’s own tile, standing, all of it showing', () => {
    expect(mishapDuration(mishap)).toBeGreaterThan(1000)
    expect(mishapDuration(mishap)).toBeLessThan(2500)
    for (const direction of directions)
      for (const t of [0, mishapDuration(mishap), mishapDuration(mishap) + 1000])
        expect(mishapPose(mishap, t, direction)).toMatchObject({ along: 0, lift: 0, sink: 0, shown: null, angle: 0, wobble: 0, stars: null } satisfies Partial<MishapPose>)
  })

  it('moves in whole pixels (pixel art), and never past the obstacle’s tile', () => {
    for (const direction of directions)
      for (const p of posesOf(mishap, direction)) {
        for (const value of [p.lift, p.sink, p.angle, p.wobble]) expect(Number.isInteger(value), `${p.t}`).toBe(true)
        expect(p.along >= 0 && p.along <= 1).toBe(true)
      }
  })

  it('has its sounds while it happens', () => {
    expect(mishapEffects(mishap).length).toBeGreaterThan(0)
    for (const effect of mishapEffects(mishap)) expect(effect.at > 0 && effect.at < mishapDuration(mishap)).toBe(true)
  })
})

describe('falling into the water', () => {
  const poses = posesOf('splash')

  it('hops into the water, goes all the way under, and comes back up with its head above the water, looking at the child', () => {
    const wet = poses.filter((p) => p.shown !== null)
    expect(wet.length).toBeGreaterThan(0)
    for (const p of wet) expect(p.along).toBe(1)
    const firstUnder = wet.findIndex((p) => p.shown === 0)
    expect(firstUnder).toBeGreaterThan(-1)
    expect(wet.slice(firstUnder).some((p) => p.facing === 'down' && p.shown! > outfitHeadTop + 8)).toBe(true)
  })

  it('looks at the water going in and at the bank coming out', () => {
    const dry = poses.filter((p) => p.shown === null && p.t > 0 && p.t < mishapDuration('splash'))
    expect(dry.filter((p) => p.t < 500).every((p) => p.facing === 'side')).toBe(true)
    expect(dry.filter((p) => p.t > 1000).every((p) => p.facing === 'left')).toBe(true)
    expect(Math.max(...dry.map((p) => p.lift))).toBeGreaterThan(3)
  })

  it('splashes as it lands, bubbles while it is under, and rings the water as it comes up', () => {
    const landed = poses.find((p) => p.shown !== null)!.t
    const [splash, ...rest] = mishapEffects('splash')
    expect(splash!.effect).toBe('splash')
    expect(Math.abs(splash!.at - landed)).toBeLessThanOrEqual(10)
    for (const bubble of rest.filter((e) => e.effect === 'bubble')) expect(mishapPose('splash', bubble.at, 'right').shown).toBe(0)
    expect(mishapPose('splash', rest.find((e) => e.effect === 'ripple')!.at, 'right').facing).toBe('down')
  })
})

describe('bonking into a tree', () => {
  const poses = posesOf('bonk')
  const [bonk] = mishapEffects('bonk')

  it('walks at the tree and bonks when it gets there, then bounces back', () => {
    expect(bonk!.effect).toBe('bonk')
    const before = poses.filter((p) => p.t < bonk!.at)
    expect(before.every((p) => p.walking && p.facing === 'side')).toBe(true)
    const furthest = Math.max(...poses.map((p) => p.along))
    expect(furthest).toBeGreaterThan(0.2)
    expect(furthest).toBeLessThan(0.5)
    expect(mishapPose('bonk', bonk!.at, 'right').along).toBeCloseTo(furthest, 1)
  })

  it('sees stars after the bonk, wobbling and looking at the child', () => {
    const starry = poses.filter((p) => p.stars !== null)
    expect(starry.length * 10).toBeGreaterThan(800)
    expect(starry.every((p) => p.t >= bonk!.at)).toBe(true)
    expect(new Set(starry.map((p) => p.stars)).size).toBeGreaterThan(50)
    expect(poses.some((p) => p.wobble !== 0 && p.facing === 'down')).toBe(true)
  })
})

describe('tripping over a rock', () => {
  const [thud] = mishapEffects('trip')

  it('falls flat forward over the rock, thuds, lies there, then gets up looking at the child', () => {
    expect(thud!.effect).toBe('thud')
    expect(mishapPose('trip', thud!.at, 'right')).toMatchObject({ angle: 90, facing: 'side' })
    expect(mishapPose('trip', thud!.at, 'left')).toMatchObject({ angle: -90, facing: 'left' })
    // Towards the child it lands on its front: upside down, its back showing.
    expect(mishapPose('trip', thud!.at, 'down')).toMatchObject({ angle: 180, facing: 'up' })
    const lying = posesOf('trip').filter((p) => p.angle === 90)
    expect(lying.length * 10).toBeGreaterThan(400)
    expect(posesOf('trip').at(-2)!.facing).toBe('down')
  })

  it('only starts falling once it has stepped onto the rock', () => {
    const poses = posesOf('trip')
    const firstTilt = poses.find((p) => p.angle !== 0)!
    expect(poses.filter((p) => p.t < firstTilt.t && p.along < 0.35).every((p) => p.walking)).toBe(true)
    expect(firstTilt.along).toBeGreaterThan(0.3)
  })
})
