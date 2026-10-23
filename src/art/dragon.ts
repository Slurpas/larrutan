import { Pixels } from './pixels'

/**
 * Mata draken (Hitta bokstaven): a friendly green dragon sitting on the meadow, facing
 * left towards the child, and the letter cookies it asks for. The letters on the
 * cookies are UI text (Andika), never pixels.
 */
export const dragonSize = { width: 58, height: 48 } as const
/** Where a cookie goes in: the middle of the open mouth, on the dragon's canvas. */
export const dragonMouth = { x: 7, y: 26 } as const

export type DragonFace = 'closed' | 'open' | 'chew'

function dragon(face: DragonFace): string[] {
  const d = new Pixels(dragonSize.width, dragonSize.height)
  // Tail, curling up behind, with a spade at the tip.
  d.stroke([[44, 38], [52, 34], [55, 26], [52, 20]], 2.6, 'Q')
  d.polygon([[49, 21], [52, 14], [55.5, 20]], 'Y')
  // A small wing on the back.
  d.polygon([[33, 22], [44, 9], [47, 13], [45, 24]], 'l')
  d.stroke([[35, 21], [44, 11]], 0.5, 'Q')
  d.stroke([[38, 23], [45.5, 14]], 0.5, 'Q')
  // Body and legs.
  d.ellipse(34, 33, 15, 11.5, 'Q')
  d.rect(22, 38, 7, 8, 'Q').rect(39, 39, 7, 7, 'G')
  d.shade('Q', 'G', (x, y) => x + y > 72)
  d.ellipse(30, 35, 8.5, 8, 'e')
  d.shade('e', 'L', (_x, y) => y % 3 === 0)
  for (const x of [22, 25, 28, 39, 42, 45]) d.set(x, 45, 'e')
  // Spikes along the back.
  for (const [x, y] of [[26, 22], [31, 20.5], [36, 21], [41, 23]] as const) d.polygon([[x - 2, y + 1.5], [x, y - 3], [x + 2, y + 1.5]], 'Y')
  // Neck and head, with a long friendly snout.
  d.ellipse(21, 24, 6, 8, 'Q')
  d.ellipse(17, 16, 10, 8.5, 'Q')
  d.ellipse(9, 22, 8, 5.5, 'Q')
  d.shade('Q', 'l', (x, y) => y < 12 && x < 20)
  // Two little horns.
  d.polygon([[16, 9], [17.5, 3], [20, 9]], 'e').polygon([[22, 10], [25, 5], [25.5, 11]], 'e')
  // Eye, cheek and nostril.
  d.ellipse(17.5, 14.5, 3.6, 4.2, 'w')
  d.rect(16, 14, 2, 3, 'o').set(16, 14, 'w')
  d.set(12, 19, 'c').set(13, 19, 'c')
  d.set(3, 20, 'G').set(4, 20, 'G')
  // The mouth.
  if (face === 'closed') {
    d.stroke([[2.5, 24.5], [11, 25.5], [13, 24.5]], 0.5, 'o')
  } else {
    const open = face === 'open' ? 6 : 3
    d.polygon([[1, 23.5], [13, 24], [13, 25 + open / 2], [2, 24 + open]], 'R')
    d.stroke([[4, 24 + open - 0.8], [10, 24.5 + open / 2]], 0.6, 'p')
    for (const x of [3, 6, 9]) d.set(x, 24, 'w')
  }
  return d.outline('o').toGrid()
}

export const dragonFaces: Record<DragonFace, readonly string[]> = {
  closed: dragon('closed'),
  open: dragon('open'),
  chew: dragon('chew'),
}

/** A round letter cookie with a darker rim and a few crumbs of chocolate near the edge. */
export const cookieSize = 26
export const cookie: readonly string[] = (() => {
  const c = new Pixels(cookieSize, cookieSize)
  const mid = cookieSize / 2
  c.fill((x, y) => Math.hypot(x - mid, y - mid) <= 12, 'L')
  c.fill((x, y) => {
    const r = Math.hypot(x - mid, y - mid)
    return r <= 12 && r > 10.4
  }, 'a')
  for (const [x, y] of [[5, 9], [19, 6], [21, 17], [7, 19], [13, 4]] as const) c.set(x, y, 'D')
  c.fill((x, y) => Math.hypot(x - 8.5, y - 8.5) <= 1.6, 'e')
  return c.outline('o').toGrid()
})()

/** Crumbs flying from the dragon's mouth while it chews. */
export const crumbs: readonly string[] = (() => {
  const c = new Pixels(10, 8)
  for (const [x, y, color] of [[1, 2, 'L'], [4, 0, 'a'], [7, 3, 'L'], [3, 5, 'd'], [8, 6, 'a'], [0, 6, 'L']] as const) c.set(x, y, color)
  return c.toGrid()
})()
