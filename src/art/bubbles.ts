import { composeCharacter, outfitSize, type Outfit } from './outfit'
import { Pixels } from './pixels'

/**
 * Bubblor (Hitta bokstaven): soap bubbles over a meadow, seen from the side, and the
 * child's own character blowing them. The letters in the bubbles are UI text (Andika),
 * never pixels.
 */
export const bubbleSize = 30
const centre = bubbleSize / 2

/** The bubble's rim: white, light blue towards the bottom right, with a shine at the top left. */
export const bubbleRing: readonly string[] = (() => {
  const b = new Pixels(bubbleSize, bubbleSize)
  b.fill((x, y) => {
    const d = Math.hypot(x - centre, y - centre)
    return d <= 14.5 && d > 13
  }, 'w')
  b.shade('w', 'U', (x, y) => x + y > 33)
  b.shade('U', 'u', (x, y) => x + y > 42)
  // The shine: a short arc inside the rim, and a sparkle.
  b.fill((x, y) => {
    const d = Math.hypot(x - centre, y - centre)
    return d <= 12.2 && d > 10.8 && x < centre - 2 && y < centre - 2 && Math.abs(x - y) < 7
  }, 'w')
  b.rect(19, 7, 2, 2, 'w')
  return b.toGrid()
})()

/** The inside of the bubble, drawn see-through behind the rim and the letter. */
export const bubbleFill: readonly string[] = new Pixels(bubbleSize, bubbleSize)
  .fill((x, y) => Math.hypot(x - centre, y - centre) <= 13.5, 'U')
  .toGrid()

/** A popped bubble: droplets flying out where the rim was. */
export const bubbleBurst: readonly string[] = (() => {
  const b = new Pixels(bubbleSize, bubbleSize)
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 + 0.3
    const [x, y] = [centre + Math.cos(a) * 12, centre + Math.sin(a) * 12]
    b.stroke([[x, y], [centre + Math.cos(a) * 14.5, centre + Math.sin(a) * 14.5]], 0.8, k % 2 ? 'w' : 'U')
  }
  for (const [x, y] of [[8, 15], [22, 9], [15, 23]] as const) b.set(x, y, 'w')
  return b.toGrid()
})()

/** The blower is the character (outfitSize) plus room on the right for the raised wand. */
const blowerWidth = outfitSize.width + 6
/** Where the bubbles come from: the middle of the wand's ring, on the blower's canvas. */
export const wandRing = { x: 25.5, y: 16.5 } as const

/** A plastic bubble wand held up beside the head: a yellow ring on a red stick, from the hand (18, 29). */
const wand: readonly string[] = (() => {
  const w = new Pixels(blowerWidth, outfitSize.height)
  w.stroke([[18.5, 29.5], [22.5, 20]], 0.7, 'r')
  w.fill((x, y) => {
    const d = Math.hypot(x - wandRing.x, y - wandRing.y)
    return d <= 4.6 && d > 2.8
  }, 'y')
  w.shade('y', 'Y', (x, y) => x + y > wandRing.x + wandRing.y + 2)
  return w.outline('o').toGrid()
})()

/** The child, dressed, facing us and holding the bubble wand up (instead of anything held). */
export function bubbleBlower(outfit: Outfit): string[] {
  const handsFree: Outfit = Object.fromEntries(Object.entries(outfit).filter(([slot]) => slot !== 'held'))
  return new Pixels(blowerWidth, outfitSize.height).draw(composeCharacter('down', 0, handsFree), 0, 0).draw(wand, 0, 0).toGrid()
}

/** The meadow seen from the side: a grassy edge on dark soil (top tile), and soil below. Both repeat sideways. */
export const meadowTop: readonly string[] = (() => {
  const t = new Pixels(16, 16).rect(0, 4, 16, 12, 'D')
  t.rect(0, 3, 16, 4, 'q').rect(0, 6, 16, 1, 'Q')
  for (const x of [1, 4, 6, 9, 12, 14]) t.rect(x, 1 + (x % 3), 1, 3, x % 2 ? 'Q' : 'q')
  for (const [x, y] of [[3, 10], [11, 9], [7, 13], [14, 12]] as const) t.set(x, y, 'h')
  t.set(5, 11, 'j').set(12, 14, 'j')
  return t.toGrid()
})()

export const meadowSoil: readonly string[] = (() => {
  const t = new Pixels(16, 16).rect(0, 0, 16, 16, 'D')
  for (const [x, y] of [[3, 2], [11, 5], [7, 9], [14, 12], [1, 13]] as const) t.set(x, y, 'h')
  for (const [x, y] of [[5, 6], [12, 1], [9, 14]] as const) t.set(x, y, 'j')
  return t.toGrid()
})()

/** A flower on the meadow's edge. */
export const meadowFlower: readonly string[] = (() => {
  const f = new Pixels(7, 9)
  f.rect(3, 4, 1, 5, 'G')
  for (const [x, y] of [[3, 0], [1, 2], [5, 2], [3, 4]] as const) f.rect(x - 1, y, 2, 2, 'w')
  f.rect(2, 2, 2, 2, 'y')
  return f.outline('o').toGrid()
})()

/** A small cloud. */
export const cloud: readonly string[] = (() => {
  const c = new Pixels(34, 15)
  c.ellipse(10, 9, 8, 5, 'w').ellipse(19, 7, 9, 6.5, 'w').ellipse(26, 10, 6.5, 4, 'w').rect(4, 10, 26, 4, 'w')
  c.shade('w', 'g', (_x, y) => y >= 12)
  return c.toGrid()
})()
