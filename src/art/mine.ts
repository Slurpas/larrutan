import { composeCharacter, type Outfit } from './outfit'
import { Pixels } from './pixels'

/**
 * Gruvvagnen, the mine cart ride (Första bokstaven): a dirt floor, tracks, rock walls
 * with tunnels, planks that close a wrong tunnel, and the cart with the child's own
 * dressed character in it. Seen from above like the map, 16×16 tiles, the cart riding
 * up the screen. The letters on the tunnels are UI cards, never pixels.
 */
export const mineTile = 16

/** Dirt floor with a few specks and a pebble; repeats in every direction. */
export const floorTile: readonly string[] = (() => {
  const tile = new Pixels(mineTile, mineTile).rect(0, 0, mineTile, mineTile, 'a')
  for (const [x, y] of [[2, 3], [9, 1], [13, 6], [5, 10], [11, 13], [7, 7], [0, 14]] as const) tile.set(x, y, 'd')
  for (const [x, y] of [[3, 12], [12, 9], [14, 2], [6, 4], [1, 7]] as const) tile.set(x, y, 'L')
  tile.rect(9, 10, 2, 1, 'n').set(9, 9, 'g')
  return tile.toGrid()
})()

/** One track running up the screen: dark sleepers under two steel rails. Repeats up and down. */
export const railTile: readonly string[] = (() => {
  const tile = new Pixels(mineTile, mineTile)
  for (const y of [1, 9]) tile.rect(1, y, 14, 3, 'D').rect(1, y, 14, 1, 'd')
  for (const x of [3, 11]) tile.rect(x, 0, 1, mineTile, 'g').rect(x + 1, 0, 1, mineTile, 'n')
  tile.set(3, 5, 'w').set(11, 13, 'w')
  return tile.toGrid()
})()

/** Rock: stone blocks lit from the top left; repeats in every direction. */
export const rockTile: readonly string[] = (() => {
  const tile = new Pixels(mineTile, mineTile).rect(0, 0, mineTile, mineTile, 'n')
  const block = (x: number, y: number, w: number, h: number) =>
    tile.rect(x, y, w, 1, 'g').rect(x, y, 1, h, 'g').rect(x, y + h - 1, w, 1, 'm').rect(x + w - 1, y, 1, h, 'm')
  block(0, 0, 6, 8)
  block(6, 0, 10, 8)
  block(0, 8, 11, 8)
  block(11, 8, 5, 8)
  tile.set(9, 4, 'm').set(3, 12, 'm').set(13, 11, 'g')
  return tile.toGrid()
})()

/** A tunnel in the rock: a wooden frame round a dark opening, with the rails running in. */
export const tunnelSize = { width: 32, height: 32 } as const
export const tunnelMouth: readonly string[] = (() => {
  const t = new Pixels(tunnelSize.width, tunnelSize.height)
  t.rect(6, 7, 20, 25, 'B')
  for (const x of [12, 19]) t.rect(x, 24, 1, 8, 'm')
  for (const x of [3, 25]) t.rect(x, 5, 4, 27, 'd').rect(x, 5, 1, 27, 'L').rect(x + 3, 5, 1, 27, 'D')
  t.rect(1, 2, 30, 5, 'd').rect(1, 2, 30, 1, 'L').rect(1, 6, 30, 1, 'D')
  for (const x of [2, 29]) t.set(x, 4, 'D')
  return t.outline('o').toGrid()
})()

/** Two planks nailed across a tunnel the child already tried: that way is closed. */
export const planks: readonly string[] = (() => {
  const p = new Pixels(26, 17)
  for (const [y, x0, x1] of [[2, 1, 25], [9, 2, 24]] as const) {
    p.rect(x0, y, x1 - x0, 5, 'd').rect(x0, y, x1 - x0, 1, 'L').rect(x0, y + 4, x1 - x0, 1, 'D')
    p.set(x0 + 1, y + 2, 'D').set(x1 - 2, y + 2, 'D')
  }
  return p.outline('o').toGrid()
})()

/** A lantern for the rock wall between the tunnels. */
export const lantern: readonly string[] = (() => {
  const l = new Pixels(8, 11)
  l.rect(3, 0, 2, 2, 'D')
  l.rect(1, 2, 6, 8, 'D').rect(2, 3, 4, 6, 'y').rect(3, 4, 2, 3, 'w')
  return l.outline('o').toGrid()
})()

/** The cart seen from behind: a steel tub with ribs and rivets on two small wheels (22×14, plus its outline). */
const cart: readonly string[] = (() => {
  const c = new Pixels(24, 15)
  c.rect(2, 12, 5, 3, 'B').rect(17, 12, 5, 3, 'B').set(4, 13, 'm').set(19, 13, 'm')
  c.rect(1, 1, 22, 12, 'n')
  c.rect(1, 1, 22, 2, 'g').rect(1, 1, 22, 1, 'w')
  for (const x of [7, 16]) c.rect(x, 3, 1, 9, 'm')
  c.rect(1, 10, 22, 2, 'm')
  for (const [x, y] of [[3, 4], [20, 4], [3, 8], [20, 8]] as const) c.set(x, y, 'g')
  return c.outline('o').toGrid()
})()

/** Where the cart's rim is on the rider's canvas: at the hips, so the top and anything on the back show. */
const cartTop = 30
export const cartSize = { width: 26, height: cartTop + 14 } as const

/** The child's character, dressed, seen from behind, riding in the cart (src/art/outfit.ts). */
export function cartWithRider(outfit: Outfit): string[] {
  const rider = composeCharacter('up', 0, outfit)
  return new Pixels(cartSize.width, cartSize.height).draw(rider, 0, 0).rect(0, cartTop, cartSize.width, 14, '.').draw(cart, 1, cartTop - 1).toGrid()
}
