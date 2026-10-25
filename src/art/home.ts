import { Pixels } from './pixels'

/**
 * The child's room in the blue house (Task 27): wallpaper, a wooden floor, a window, a
 * wardrobe where the clothes are, a mirror, a bed and a rug. 16×16-style pixel art in
 * Kenney's colours (docs/ART_DIRECTION.md), drawn with the same helper as our other sprites.
 */

/** Wallpaper: calm cream with a few small dots. Repeats across the wall. */
export const wallTile: readonly string[] = (() => {
  const w = new Pixels(16, 16)
  w.rect(0, 0, 16, 16, 'e')
  w.set(3, 3, 'L').set(11, 11, 'L')
  return w.toGrid()
})()

/** Long wooden planks, their ends staggered from row to row. Repeats across the floor. */
export const floorTile: readonly string[] = (() => {
  const f = new Pixels(32, 16)
  f.rect(0, 0, 32, 16, 'd')
  f.rect(0, 7, 32, 1, 'D').rect(0, 15, 32, 1, 'D')
  f.rect(0, 0, 1, 7, 'D').rect(16, 8, 1, 7, 'D')
  for (const [x, y] of [[6, 2], [7, 2], [22, 4], [11, 11], [12, 11], [27, 12]] as const) f.set(x, y, 'a')
  return f.toGrid()
})()

/** A window with sky and a cloud, between red curtains. */
export const windowArt: readonly string[] = (() => {
  const w = new Pixels(36, 28)
  w.rect(6, 2, 24, 22, 'd')
  w.rect(8, 4, 20, 18, 'u')
  w.rect(8, 13, 20, 9, 'U')
  w.ellipse(13, 9, 3, 1.6, 'w').ellipse(16, 8, 2.6, 2, 'w')
  w.rect(17, 4, 2, 18, 'd').rect(8, 12, 20, 2, 'd')
  w.rect(4, 23, 28, 2, 'D')
  // Curtains, gathered at the sides.
  w.polygon([[1, 0], [9, 0], [7, 14], [9, 27], [2, 27], [3, 14]], 'r')
  w.polygon([[35, 0], [27, 0], [29, 14], [27, 27], [34, 27], [33, 14]], 'r')
  w.shade('r', 'R', (x) => x === 4 || x === 5 || x === 31 || x === 32)
  w.rect(0, 0, 36, 1, 'D')
  return w.outline('o').toGrid()
})()

/** The wardrobe, shut: two doors with round knobs, on little feet. */
export const wardrobeShut: readonly string[] = (() => {
  const w = new Pixels(32, 48)
  w.rect(1, 0, 30, 3, 'D')
  w.rect(2, 3, 28, 41, 'd')
  w.rect(4, 5, 11, 37, 'L').rect(17, 5, 11, 37, 'L')
  w.rect(5, 6, 9, 35, 'd').rect(18, 6, 9, 35, 'd')
  w.rect(15.5, 3, 1, 41, 'D')
  w.ellipse(13.5, 24, 1.2, 1.2, 'y').ellipse(18.5, 24, 1.2, 1.2, 'y')
  w.rect(3, 44, 3, 4, 'D').rect(26, 44, 3, 4, 'D')
  return w.outline('o').toGrid()
})()

/** The wardrobe, open: the doors swung out, the child's clothes hanging inside. */
export const wardrobeOpen: readonly string[] = (() => {
  const w = new Pixels(48, 48)
  w.rect(9, 0, 30, 3, 'D')
  w.rect(10, 3, 28, 41, 'D')
  w.rect(12, 5, 24, 37, 'R')
  w.rect(12, 5, 24, 37, 'a')
  // A rail with a sweater and trousers, and a hat on the shelf.
  w.rect(12, 14, 24, 1, 'g')
  w.polygon([[15, 15], [21, 15], [22, 18], [21, 28], [15, 28], [14, 18]], 'r')
  w.rect(25, 15, 7, 2, 'b').rect(25, 17, 3, 12, 'b').rect(29, 17, 3, 12, 'b')
  w.rect(12, 33, 24, 1, 'D')
  w.ellipse(24, 31, 4, 2, 'u').rect(20, 31, 8, 2, 'u')
  // The doors, seen edge-on, swung out to either side.
  w.polygon([[10, 3], [2, 6], [2, 44], [10, 44]], 'd')
  w.polygon([[38, 3], [46, 6], [46, 44], [38, 44]], 'd')
  w.set(4, 24, 'y').set(44, 24, 'y')
  w.rect(11, 44, 3, 4, 'D').rect(34, 44, 3, 4, 'D')
  return w.outline('o').toGrid()
})()

/** Where the mirror's glass is, on its sprite: the reflection is drawn inside it. */
export const mirrorGlass = { x: 3, y: 2, width: 16, height: 30 } as const

/** A tall mirror in a golden frame, on a wooden stand. */
export const mirrorArt: readonly string[] = (() => {
  const m = new Pixels(22, 44)
  m.ellipse(11, 17, 10.5, 17, 'Y')
  m.ellipse(11, 17, 8, 15, 'g')
  m.shade('g', 'w', (x, y) => x + y < 16)
  m.rect(10, 34, 2, 7, 'D')
  m.polygon([[3, 44], [11, 39], [19, 44]], 'D')
  return m.outline('o').toGrid()
})()

/** A bed with a blue blanket and a white pillow, its head against the right wall. */
export const bedArt: readonly string[] = (() => {
  const b = new Pixels(46, 26)
  b.rect(36, 0, 8, 26, 'd').rect(36, 0, 8, 2, 'D')
  b.rect(2, 11, 36, 10, 'w')
  b.rect(2, 13, 28, 9, 'u')
  b.rect(2, 13, 28, 2, 'U')
  b.ellipse(33, 12, 4, 2.6, 'w')
  b.shade('w', 'g', (_x, y) => y >= 14)
  b.rect(1, 21, 37, 3, 'D')
  b.rect(2, 24, 2, 2, 'D').rect(34, 24, 2, 2, 'D')
  return b.outline('o').toGrid()
})()

/** An oval rug with a striped border. */
export const rugArt: readonly string[] = (() => {
  const r = new Pixels(50, 12)
  r.ellipse(25, 6, 24.5, 5.5, 'R')
  r.ellipse(25, 6, 21.5, 4, 'r')
  r.ellipse(25, 6, 17, 2.8, 'p')
  r.shade('R', 'y', (x) => x % 4 === 0)
  return r.toGrid()
})()
