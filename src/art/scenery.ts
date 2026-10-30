import { Pixels } from './pixels'

/**
 * Our own scenery, for what Kenney's Tiny Town doesn't have: water (with a splash) and rocks.
 * 16×16 tiles in the shared palette (./palette.ts), lit from the top left.
 */

/** A grey rock on transparent ground, with its outline and a soft highlight. */
export const rock: readonly string[] = new Pixels(16, 16)
  .ellipse(8, 10, 5.5, 4.2, 'n')
  .ellipse(6.5, 8.5, 3, 2.2, 'g')
  .shade('n', 'm', (x, y) => y >= 12 || x >= 11)
  .outline('o')
  .toGrid()

/** Which neighbours of a water tile are land, so its edges and corners can be drawn. */
export interface WaterEdges {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  upLeft: boolean
  upRight: boolean
  downLeft: boolean
  downRight: boolean
}

/**
 * One water tile: deep blue with ripples, a light foam line and a darker grass
 * bank where it meets land, and rounded outer corners.
 */
export function waterTile(edges: WaterEdges, variant: number): string[] {
  const size = 16
  const radius = 4
  const tile = new Pixels(size, size)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      // Distance from this pixel to the nearest land edge.
      let distance = Math.min(
        edges.left ? x : Infinity,
        edges.right ? size - 1 - x : Infinity,
        edges.up ? y : Infinity,
        edges.down ? size - 1 - y : Infinity,
      )
      const corners: [boolean, number, number][] = [
        [edges.left && edges.up, radius, radius],
        [edges.right && edges.up, size - 1 - radius, radius],
        [edges.left && edges.down, radius, size - 1 - radius],
        [edges.right && edges.down, size - 1 - radius, size - 1 - radius],
      ]
      for (const [round, cx, cy] of corners) {
        const inCorner = (cx < size / 2 ? x < cx : x > cx) && (cy < size / 2 ? y < cy : y > cy)
        if (round && inCorner) distance = Math.min(distance, radius - Math.hypot(x - cx, y - cy))
      }
      // Inner corners: land only diagonally.
      const diagonals: [boolean, number, number][] = [
        [edges.upLeft && !edges.up && !edges.left, 0, 0],
        [edges.upRight && !edges.up && !edges.right, size - 1, 0],
        [edges.downLeft && !edges.down && !edges.left, 0, size - 1],
        [edges.downRight && !edges.down && !edges.right, size - 1, size - 1],
      ]
      for (const [land, cx, cy] of diagonals) if (land) distance = Math.min(distance, Math.hypot(x - cx, y - cy) - 1)
      tile.set(x, y, distance < 0 ? 'q' : distance < 1 ? 'Q' : distance < 2 ? 'U' : 'u')
    }
  // Ripples, in two layouts so neighbouring tiles don't repeat exactly.
  const ripples: [number, number][] = variant % 2 === 0 ? [[3, 5], [9, 11]] : [[8, 4], [2, 10]]
  for (const [x, y] of ripples) if (tile.get(x, y) === 'u' && tile.get(x + 3, y) === 'u') tile.rect(x, y, 4, 1, 'U')
  return tile.toGrid()
}

/** Little accidents (src/world/mishaps.ts): a ring spreading on the water, a splashed drop and a bubble; a star seen after a bonk; a puff of dust. */
export const ripple: readonly string[] = new Pixels(14, 6).ellipse(7, 3, 7, 3, 'w').ellipse(7, 3, 5, 1.8, '.').toGrid()
export const drop: readonly string[] = ['wU', 'UU']
export const bubble: readonly string[] = ['.ww.', 'w..w', 'w..w', '.ww.']
export const star: readonly string[] = new Pixels(7, 7)
  .polygon(
    [
      [3.5, 0.5],
      [4.4, 2.6],
      [6.5, 2.7],
      [4.9, 4.1],
      [5.5, 6.4],
      [3.5, 5.1],
      [1.5, 6.4],
      [2.1, 4.1],
      [0.5, 2.7],
      [2.6, 2.6],
    ],
    'y',
  )
  .set(3, 2, 'w')
  .toGrid()
export const dust: readonly string[] = new Pixels(6, 4).ellipse(3, 2, 3, 2, 'g').set(2, 1, 'w').set(3, 1, 'w').toGrid()
