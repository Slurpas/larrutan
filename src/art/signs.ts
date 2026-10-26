import { Pixels } from './pixels'

/**
 * Station signs: a wooden board on two posts, 32×32 pixels (the station's 2×2
 * tiles), with a light panel for the station's letters or pictures. Letters are
 * never pixels: the game writes them on the panel in the literacy font (Andika).
 */
export const signSize = { width: 32, height: 32 } as const

/** The panel's area within the sign, in sign pixels: where letters and pictures go. */
export const signPanel = { x: 4, y: 5, width: 24, height: 14 } as const

/** Highlighted when the child stands next to it: the panel turns yellow. */
export function stationSign(highlighted: boolean): string[] {
  const sign = new Pixels(signSize.width, signSize.height)
  // Two posts.
  for (const x of [7, 22]) sign.rect(x, 20, 3, 11, 'd').rect(x + 2, 20, 1, 11, 'D')
  // Board: light wood on top and left, darker at the bottom and right.
  sign.rect(1, 2, 30, 20, 'd')
  sign.rect(1, 2, 30, 1, 'L').rect(1, 2, 1, 20, 'L')
  sign.rect(1, 21, 30, 1, 'D').rect(30, 2, 1, 20, 'D')
  // Panel, with a shadow line under its top edge.
  sign.rect(signPanel.x, signPanel.y, signPanel.width, signPanel.height, highlighted ? 'y' : 'w')
  sign.rect(signPanel.x, signPanel.y, signPanel.width, 1, highlighted ? 'Y' : 'g')
  // Nails in the corners.
  for (const [x, y] of [[2, 3], [29, 3], [2, 20], [29, 20]] as const) sign.set(x, y, 'D')
  return sign.outline('o').toGrid()
}

/** Pictures for the signs (Första bokstaven: a sun; Ord och bild: an apple and a mouse; Memory: two cards; Sortera korten: two piles). */
export const sun: readonly string[] = (() => {
  const icon = new Pixels(13, 13)
  // Rays: straight up, down and sideways, and four diagonals.
  icon.rect(6, 1, 1, 2, 'Y').rect(6, 10, 1, 2, 'Y').rect(1, 6, 2, 1, 'Y').rect(10, 6, 2, 1, 'Y')
  for (const [x, y] of [[2, 2], [10, 2], [2, 10], [10, 10]] as const) icon.set(x, y, 'Y')
  icon.ellipse(6.5, 6.5, 3.4, 3.4, 'y')
  icon.shade('y', 'Y', (x, y) => x + y >= 15)
  icon.set(5, 5, 'w')
  return icon.outline('o').toGrid()
})()

export const apple: readonly string[] = (() => {
  const icon = new Pixels(11, 12)
  icon.ellipse(5.5, 7, 4.6, 4.4, 'r')
  icon.shade('r', 'R', (x, y) => x >= 7 && y >= 7)
  icon.set(3, 5, 'w').set(3, 6, 'w')
  icon.outline('o')
  icon.rect(5, 0, 1, 3, 'D')
  icon.rect(6, 1, 3, 1, 'G').set(7, 0, 'G')
  return icon.toGrid()
})()

export const mouse: readonly string[] = (() => {
  const icon = new Pixels(12, 11)
  icon.ellipse(6, 7, 4.5, 3.2, 'n')
  icon.ellipse(3, 3.5, 2, 2, 'n').ellipse(9, 3.5, 2, 2, 'n')
  icon.set(3, 3, 'c').set(9, 3, 'c')
  icon.shade('n', 'm', (_x, y) => y >= 9)
  icon.set(4, 7, 'o').set(8, 7, 'o').set(6, 8, 'c')
  return icon.outline('o').toGrid()
})()

export const cards: readonly string[] = (() => {
  const icon = new Pixels(12, 11)
  // A card face down (blue, with a star) behind one face up (a little apple).
  icon.rect(1, 1, 6, 9, 'u')
  icon.set(3, 4, 'y').rect(2, 5, 3, 1, 'y').set(3, 6, 'y')
  // The front card's edge over the back one; the outline draws the rest.
  icon.rect(5, 2, 1, 9, 'o').set(6, 2, 'o').rect(6, 3, 5, 7, 'w')
  icon.rect(7, 6, 2, 2, 'r').set(8, 5, 'G')
  return icon.outline('o').toGrid()
})()

export const piles: readonly string[] = (() => {
  const icon = new Pixels(17, 12)
  // Two piles of cards, fanned like the game's, so a strip of each card underneath shows: apples on one, suns on the other.
  for (const [x, under, dot] of [[0, 2, 'r'], [9, 1, 'y']] as const) {
    for (let k = under; k >= 0; k--) icon.rect(x, 4 - 2 * k, 8, 8, 'o').rect(x + 1, 5 - 2 * k, 6, 6, 'w')
    for (let k = 1; k <= under; k++) icon.set(x + 2, 5 - 2 * k, dot)
  }
  // An apple, and a sun.
  icon.rect(2, 7, 4, 2, 'r').rect(3, 9, 2, 1, 'r').set(5, 8, 'R').set(4, 6, 'G')
  icon.rect(12, 6, 2, 4, 'y').rect(11, 7, 4, 2, 'y').set(14, 8, 'Y').set(13, 9, 'Y')
  return icon.toGrid()
})()
