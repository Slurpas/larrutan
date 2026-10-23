import { describe, expect, it } from 'vitest'
import { cartSize, mineTile, tunnelSize } from '../../art/mine'
import { arriving, departing, gateHeight, nearestLane, rideLayout, rideScale, startLane } from './ride'

const screens = {
  'iPad landscape': [1080, 810],
  'iPad portrait': [810, 1080],
  'desktop': [1280, 720],
  'small laptop': [1024, 600],
} as const

describe('the ride layout', () => {
  it('zooms by whole numbers, as large as fits', () => {
    expect(rideScale(1080, 810)).toBe(5)
    expect(rideScale(1280, 720)).toBe(4)
    expect(rideScale(810, 1080)).toBe(4)
    for (const [w, h] of Object.values(screens)) expect(Number.isInteger(rideScale(w, h))).toBe(true)
  })

  it('fits three or four tracks between the side walls, tunnels never touching', () => {
    for (const [name, [w, h]] of Object.entries(screens))
      for (const count of [3, 4]) {
        const { lanes, width } = rideLayout(w, h, count)
        expect(lanes, name).toHaveLength(count)
        expect(lanes[0]! - tunnelSize.width / 2, `${name}: left wall`).toBeGreaterThanOrEqual(mineTile)
        expect(lanes[count - 1]! + tunnelSize.width / 2, `${name}: right wall`).toBeLessThanOrEqual(width - mineTile)
        for (let i = 1; i < count; i++) expect(lanes[i]! - lanes[i - 1]!, name).toBeGreaterThanOrEqual(tunnelSize.width + 4)
      }
  })

  it('keeps the waiting wall below the top bar and above the cart, and the cart on screen', () => {
    for (const [name, [w, h]] of Object.entries(screens)) {
      const layout = rideLayout(w, h, 3)
      expect(layout.gateStop * layout.scale, `${name}: room for the top bar`).toBeGreaterThanOrEqual(150)
      expect(layout.gateStop + gateHeight, name).toBeLessThan(layout.cartTop)
      expect(layout.cartTop + cartSize.height, name).toBeLessThanOrEqual(layout.height)
      expect(layout.gateStart + gateHeight, `${name}: starts out of sight`).toBeLessThanOrEqual(0)
      expect(layout.gateGone, `${name}: leaves out of sight`).toBeGreaterThanOrEqual(layout.height)
    }
  })
})

describe('the ride', () => {
  it('brakes into the stop and sets off slowly', () => {
    expect(arriving(0)).toBe(0)
    expect(arriving(1)).toBe(1)
    expect(arriving(0.5)).toBeGreaterThan(0.5)
    expect(arriving(1) - arriving(0.95)).toBeLessThan(arriving(0.05) - arriving(0))
    expect(departing(0.5)).toBeLessThan(0.5)
    expect(arriving(2)).toBe(1)
    expect(departing(-1)).toBe(0)
  })

  it('starts in the middle track and finds the track nearest a tap', () => {
    expect(startLane(3)).toBe(1)
    expect(startLane(4)).toBe(1)
    const { lanes } = rideLayout(1080, 810, 3)
    expect(nearestLane(lanes[0]! - 30, lanes)).toBe(0)
    expect(nearestLane(lanes[1]! + 10, lanes)).toBe(1)
    expect(nearestLane(lanes[2]! + 100, lanes)).toBe(2)
  })
})
