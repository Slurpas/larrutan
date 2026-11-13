import { Pixels } from './pixels'

/**
 * Äppelträdet: an apple tree with room for ten apples, the apple, and a wide, shallow wicker
 * basket seen a little from above, where apples lie in two rows of five (the first row at the
 * back), so "five and two" can be seen. The basket is drawn in two parts: the apples lie between
 * its back (the rim behind and the inside) and its front (the front wall), which hides their
 * bottoms. Numbers on the apples are UI (Andika).
 */
export const appleSize = { width: 12, height: 13 } as const

export const apple: readonly string[] = (() => {
  const art = new Pixels(appleSize.width, appleSize.height)
  // Round, a little wider than tall, with a dip where the stem goes in.
  art.ellipse(6, 8, 5.1, 4.6, 'r')
  art.set(5, 3, '.').set(6, 3, '.').set(5, 4, 'r')
  art.shade('r', 'R', (x, y) => x + y >= 15 || y >= 11)
  art.rect(2, 6, 1, 2, 'p').set(3, 5, 'p')
  art.rect(6, 1, 1, 3, 'D')
  art.rect(7, 1, 2, 1, 'Q').set(8, 2, 'Q')
  return art.outline('o').toGrid()
})()

export const treeSize = { width: 100, height: 112 } as const

/** A fixed pseudo-random number per pixel, so the leaves look wild but the same every time. */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

/** The crown's round lobes: centre and radius. */
const lobes: readonly (readonly [number, number, number])[] = [
  [27, 40, 22],
  [50, 25, 25],
  [73, 40, 22],
  [38, 56, 19],
  [63, 56, 19],
  [50, 44, 26],
]

export const tree: readonly string[] = (() => {
  const art = new Pixels(treeSize.width, treeSize.height)
  // The trunk, flaring into roots at the bottom, lit from the left.
  art.polygon(
    [
      [45, 60],
      [56, 60],
      [57, 100],
      [63, 111],
      [37, 111],
      [44, 100],
    ],
    'd',
  )
  art.shade('d', 'D', (x) => x >= 53)
  art.fill((x, y) => art.get(x, y) === 'd' && y > 66 && Math.floor(y) % 9 === 0 && x > 46 && x < 50, 'D')
  // The crown: light at the top left, darker towards the bottom right, with clumps of leaves.
  for (const [cx, cy, r] of lobes) art.ellipse(cx, cy, r, r, 'Q')
  art.shade('Q', 'G', (x, y) => lobes.every(([cx, cy, r]) => Math.hypot(x + 0.5 - cx + 3, y + 0.5 - cy + 3) > r - 1))
  for (const [cx, cy, r] of lobes) art.fill((x, y) => art.get(x, y) === 'Q' && Math.hypot(x - cx + r * 0.3, y - cy + r * 0.35) < r * (0.36 + noise(x, y) * 0.08), 'q')
  art.fill((x, y) => art.get(x, y) === 'Q' && noise(x, y) < 0.1, 'G')
  art.fill((x, y) => art.get(x, y) === 'q' && noise(x, y) < 0.1, 'l')
  return art.outline('o').toGrid()
})()

/** Where apples hang on the tree (the centre of each apple), clear of each other and of the basket. */
export const treeSpots: readonly (readonly [number, number])[] = [
  [36, 13],
  [62, 12],
  [17, 32],
  [46, 29],
  [74, 29],
  [88, 45],
  [27, 47],
  [56, 45],
  [40, 62],
  [72, 58],
]

export const basketSize = { width: 84, height: 44 } as const
/** Where the basket stands, from the tree's left edge: right of the trunk, under the crown, on the same ground. */
export const basketLeft = 62

/** The opening, seen a little from above: an ellipse. */
const opening = { cx: 42, cy: 16, rx: 40, ry: 14 } as const
const inOpening = (x: number, y: number) => ((x - opening.cx) / opening.rx) ** 2 + ((y - opening.cy) / opening.ry) ** 2 <= 1
const rimWidth = 2.6
const onRim = (x: number, y: number) =>
  inOpening(x, y) && ((x - opening.cx) / (opening.rx - rimWidth)) ** 2 + ((y - opening.cy) / (opening.ry - rimWidth)) ** 2 > 1

/** The basket behind the apples: the inside, and the rim at the back. */
export const basketBack: readonly string[] = (() => {
  const art = new Pixels(basketSize.width, basketSize.height)
  art.fill(inOpening, 'D')
  art.fill((x, y) => inOpening(x, y) && y > opening.cy + 2 && Math.floor(x + y * 0.5) % 6 === 0, 'k')
  art.fill((x, y) => onRim(x, y) && y < opening.cy, 'L')
  art.fill((x, y) => onRim(x, y) && y < opening.cy && Math.floor(x + y) % 5 === 0, 'd')
  // The outline along the back rim; the front's outline belongs to the front.
  const outlined = new Pixels(basketSize.width, basketSize.height).draw(art.toGrid(), 0, 0).outline('o')
  for (let y = 0; y < opening.cy; y++) for (let x = 0; x < basketSize.width; x++) if (outlined.get(x, y) === 'o') art.set(x, y, 'o')
  return art.toGrid()
})()

/** The front of the basket: the front wall of woven straw and the rim along its top. */
export const basketFront: readonly string[] = (() => {
  const art = new Pixels(basketSize.width, basketSize.height)
  const wall = (x: number, y: number) => {
    const half = 40 - ((y - opening.cy) / (basketSize.height - 1 - opening.cy)) * 6
    return y >= opening.cy && y < basketSize.height - 1 && Math.abs(x - opening.cx) <= half && !(inOpening(x, y) && !onRim(x, y))
  }
  art.fill(wall, 'L')
  // Straw strands woven in front of and behind upright stakes, as Bokstavskorgarna's basket.
  const inFront = (x: number, y: number) => Math.floor((x + (Math.floor(y / 2) % 2) * 3) / 6) % 2 === 0
  art.fill((x, y) => art.get(x, y) === 'L' && !onRim(x, y) && inFront(x, y) && Math.floor(y) % 2 === 0, 'e')
  art.fill((x, y) => art.get(x, y) === 'L' && !onRim(x, y) && !inFront(x, y) && Math.floor(y) % 2 === 1, 'd')
  art.shade('L', 'd', (x, y) => !onRim(x + 0.5, y + 0.5) && y >= basketSize.height - 5)
  // The rim at the front: a rolled band, lighter on top.
  art.fill((x, y) => onRim(x, y) && y >= opening.cy, 'L')
  art.fill((x, y) => onRim(x, y) && y >= opening.cy && Math.floor(x + y) % 5 === 0, 'd')
  return art.outline('o').toGrid()
})()

/** The top of the front rim at x. */
const frontRim = (x: number) => opening.cy + opening.ry * Math.sqrt(Math.max(0, 1 - ((x - opening.cx) / opening.rx) ** 2))

/**
 * Where apples lie in the basket (the centre of each): the first row of five inside, at the
 * back; the second resting on the front rim, drawn in front of it (`inFrontRow`), so all ten
 * show whole.
 */
export const basketSlots: readonly (readonly [number, number])[] = Array.from({ length: 10 }, (_, i) => {
  const x = 14 + (i % 5) * 14
  return [x, i < 5 ? 11 : Math.round(frontRim(x) - 5)] as const
})

/** Apples in the second row lie in front of the basket's front, the first row behind it. */
export const inFrontRow = (slot: number) => slot >= 5
