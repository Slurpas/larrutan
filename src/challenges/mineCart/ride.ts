import { cartSize, mineTile, tunnelSize } from '../../art/mine'

/**
 * The pure rules of Gruvvagnen's ride, in art pixels (one art pixel is `scale` screen
 * pixels, a whole number, as everywhere in the pixel art). The cart stays put near the
 * bottom of the screen; the world (track, walls, the rock wall with the tunnels) moves.
 */

/** How long each part of the ride takes, in milliseconds. Arriving is never a time limit: the cart then waits. */
export const rideTimes = { arrive: 2800, pass: 1400, steer: 260, bump: 900 } as const

/** Height of the rock wall with the tunnels: room for a choice card above each tunnel. */
export const gateHeight = 60
/** The tunnel's top within the wall; the card hangs above it. */
export const tunnelTop = gateHeight - tunnelSize.height
/** Track the cart rides before the wall comes into sight. */
const cruise = 32
/** Space between the waiting cart and the wall. */
const cartGap = 12

export interface RideLayout {
  scale: number
  width: number
  height: number
  /** Centre of each track, left to right, in the same order as the choices. */
  lanes: number[]
  /** Top of the wall while the cart waits in front of it. */
  gateStop: number
  /** Top of the wall when a question starts, out of sight above the screen. */
  gateStart: number
  /** Top of the wall once the cart is through, out of sight below the screen. */
  gateGone: number
  cartTop: number
}

/** The biggest whole-number zoom at which the ride fits the screen. */
export function rideScale(screenWidth: number, screenHeight: number): number {
  return Math.max(2, Math.min(6, Math.floor(Math.min(screenWidth / 200, screenHeight / 160))))
}

export function rideLayout(screenWidth: number, screenHeight: number, laneCount: number): RideLayout {
  const scale = rideScale(screenWidth, screenHeight)
  const width = screenWidth / scale
  const height = screenHeight / scale
  // Tracks evenly spread between the side walls, never so close that the tunnels touch.
  const room = width - 2 * mineTile - tunnelSize.width
  const spacing = laneCount > 1 ? Math.min(56, room / (laneCount - 1)) : 0
  const lanes = Array.from({ length: laneCount }, (_, i) => width / 2 + (i - (laneCount - 1) / 2) * spacing)
  const cartTop = height - 4 - cartSize.height
  return {
    scale,
    width,
    height,
    lanes,
    gateStop: cartTop - cartGap - gateHeight,
    gateStart: -(gateHeight + cruise),
    gateGone: height + 8,
    cartTop,
  }
}

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))

/** Arriving: full speed at first, braking to a stop in front of the wall. Maps time 0…1 to distance 0…1. */
export function arriving(t: number): number {
  const x = clamp01(t)
  return 1 - (1 - x) ** 2
}

/** Setting off through the tunnel: slowly, then faster. */
export function departing(t: number): number {
  const x = clamp01(t)
  return x * x
}

/** The track nearest to a point across the screen (art pixels). */
export function nearestLane(x: number, lanes: readonly number[]): number {
  let best = 0
  lanes.forEach((lane, i) => {
    if (Math.abs(lane - x) < Math.abs((lanes[best] ?? lane) - x)) best = i
  })
  return best
}

/** The track the cart starts on: the middle one (left of the middle when there are four). */
export function startLane(laneCount: number): number {
  return Math.floor((laneCount - 1) / 2)
}
