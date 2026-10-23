import { Pixels } from './pixels'

/**
 * Pixel art for every item the character can wear (PRD §9, Task 10). A new item is
 * a data entry in src/rewards/items.ts plus its art here; the renderer
 * (./outfit.ts) never changes.
 *
 * Two kinds of art:
 * - **Recolours** for clothes that cover the body (tops, trousers): the base
 *   character's shirt or trouser pixels are repainted, so they fit every direction
 *   and walk frame automatically ("mask-based clothing").
 * - **Sprites** for things put on or held (hats, capes, backpacks, wings, held
 *   items): a small grid per facing, placed at a fixed point on the character.
 *   Frames only move the legs, so a point per facing is enough.
 *
 * Coordinates are in the character's 16×32 frame; sprites may reach outside it
 * (the renderer leaves a margin). Side art faces right; left is mirrored.
 */

export type Slot = 'head' | 'top' | 'bottoms' | 'back' | 'held'
export type ArtFacing = 'down' | 'up' | 'side'

export interface PlacedSprite {
  grid: readonly string[]
  x: number
  y: number
  /** Drawn behind the body (a cape seen from the front), instead of in front of it. */
  behind?: boolean
}

export interface SpriteArt {
  kind: 'sprite'
  down: PlacedSprite
  /** Defaults to `down`. */
  up?: PlacedSprite
  /** Defaults to `down`. */
  side?: PlacedSprite
}

/** Palette swaps per row of the clothing area, cycled from the top; one entry for a plain colour. */
export interface RecolorArt {
  kind: 'recolor'
  rows: readonly Readonly<Record<string, string>>[]
  /** Little dots in this colour, e.g. stars: every `every`th pixel of the area. */
  dots?: { color: string; every: number }
}

export type ItemArt = SpriteArt | RecolorArt

/** The base character's pixels each clothing slot repaints (src/art/character.ts). */
export const clothingMask: Partial<Record<Slot, readonly string[]>> = {
  top: ['r', 'R', 'p'],
  bottoms: ['b', 'B'],
}

const outlined = (rows: readonly string[], margin = 1): string[] => {
  const width = (rows[0]?.length ?? 0) + margin * 2
  return new Pixels(width, rows.length + margin * 2).draw(rows, margin, margin).outline('o').toGrid()
}

const swap = (grid: readonly string[], colors: Record<string, string>): string[] =>
  grid.map((row) => [...row].map((c) => colors[c] ?? c).join(''))

// --- Hats ---------------------------------------------------------------------

const capDown = [
  '....oooooooo....',
  '...ouuuuuuuuo...',
  '..ouUuuuuuuuuo..',
  '.ouUuuuuuuuuuuo.',
  '.ouuuuuuuuuuuuo.',
  '.ommmmmmmmmmmmo.',
  '..oooooooooooo..',
]
const capSide = [
  '....oooooooo....',
  '...ouuuuuuuuo...',
  '..ouUuuuuuuuuo..',
  '.ouUuuuuuuuuuuo.',
  '.ouuuuuuuuuuuuo.',
  '.ouuuuuuummmmmmo',
  '..oooooooooooooo',
]

const beanie = [
  '......oooo......',
  '.....oyyyyo.....',
  '....ooyyyyoo....',
  '...oQQQQQQQQo...',
  '..oQqQQQQQQQQo..',
  '.oQqQQQQQQQQQQo.',
  '.oQQQQQQQQQQQQo.',
  '.oGQGQGQGQGQGQo.',
  '.oGQGQGQGQGQGQo.',
  '..oooooooooooo..',
]

const bow = ['oo.....oo', 'ocpo.opco', 'occcRccco', 'ocpo.opco', 'oo.....oo']

const topHat = [
  '....oooooooo....',
  '....oBBBBBBo....',
  '....oBmBBBBo....',
  '....oBmBBBBo....',
  '....oBmBBBBo....',
  '....orrrrrro....',
  '....oBBBBBBo....',
  '..oBBBBBBBBBBo..',
  '..oooooooooooo..',
]

const studentCap = [
  '...oooooooooo...',
  '..owwwwwwwwwwo..',
  '..owwwwwwwwwwo..',
  '..oggggggggggo..',
  '..oBBBBuyBBBBo..',
  '.oBBBBBBBBBBBBo.',
  '..oooooooooooo..',
]
const studentCapSide = [
  '...oooooooooo...',
  '..owwwwwwwwwwo..',
  '..owwwwwwwwwwo..',
  '..oggggggggggo..',
  '..oBBBBBBBBuyo..',
  '.oBBBBBBBBBBBBBo',
  '..oooooooooooooo',
]

const crown = [
  '...o...oo...o...',
  '..oyo.oyyo.oyo..',
  '..oyyoyyyyoyyo..',
  '..oyyyyyyyyyyo..',
  '..oyRyyuuyyRyo..',
  '..oYYYYYYYYYYo..',
  '..oooooooooooo..',
]

// --- Back items ---------------------------------------------------------------

const backpackStraps = ['.....D....D.....', '.....D....D.....', '.....D....D.....', '.....D....D.....']
const backpackBack = outlined(['LLLLLLLL', 'dddddddd', 'DDDDDDDD', 'dddyyddd', 'dddddddd', 'dddddddd'])
const backpackSide = outlined(['LLL', 'ddd', 'DDD', 'dyd', 'ddd', 'ddd'])

/** A cape: wider at the hem than at the shoulders, lit from the left. */
function cape(width: (row: number) => number, rows: number, light: string, dark: string): string[] {
  const shape = new Pixels(18, rows)
  for (let y = 0; y < rows; y++) {
    const half = width(y) / 2
    shape.rect(Math.round(9 - half), y, Math.round(half * 2), 1, dark)
    shape.set(Math.round(9 - half), y, light)
  }
  return shape.outline('o').toGrid()
}
const capeFront = cape((y) => 13 + y * 0.35, 12, 'r', 'R')
const capeBack = cape((y) => 11 + y * 0.3, 12, 'r', 'R')
const capeSide = (() => {
  const shape = new Pixels(8, 13)
  for (let y = 0; y < 12; y++) shape.rect(Math.max(1, 5 - Math.floor(y / 3)), y + 1, 3 + Math.floor(y / 3), 1, 'R')
  return shape.outline('o').toGrid()
})()
const gold = { r: 'y', R: 'Y' }

function wing(width: number, height: number): string[] {
  return new Pixels(width + 2, height + 2)
    .ellipse((width + 2) / 2, (height + 2) / 2, width / 2, height / 2, 'w')
    .shade('w', 'g', (_x, y) => y % 3 === 2)
    .outline('o')
    .toGrid()
}
const wingSmall = wing(6, 10)
const wingsBehind = (() => {
  const both = new Pixels(26, 12)
  both.draw(wingSmall, 0, 0).draw(wingSmall, 18, 0)
  return both.toGrid()
})()
const wingsOnBack = (() => {
  const both = new Pixels(20, 14)
  both.draw(wing(8, 12), 0, 0).draw(wing(8, 12), 10, 0)
  return both.toGrid()
})()

// --- Held items ---------------------------------------------------------------

const flower = outlined(['.www.', 'wwyww', '.www.', '..G..', '.GG..', '..G..', '..G..'])

const balloon = (() => {
  const shape = new Pixels(9, 27)
  shape.ellipse(5.5, 4.5, 3.4, 4, 'r')
  shape.shade('r', 'R', (x, y) => x >= 6 && y >= 5)
  shape.set(4, 2, 'p').set(4, 3, 'p').set(5, 9, 'R')
  shape.outline('o')
  // The string, from the knot down to the hand.
  for (let y = 10; y < 26; y++) shape.set(5 - Math.floor((y - 10) / 4), y, 'o')
  return shape.toGrid()
})()

const wand = outlined(
  ['.....y..', '....yyy.', '...yyyyy', '....yyy.', '....y.y.', '....D...', '...D....', '...D....', '..D.....', '..D.....', '.D......'],
  1,
)
/** Seen from the side, the wand is held forward, away from the face. */
const wandSide = outlined(['......y..', '.....yyy.', '....yyyyy', '.....yyy.', '....Dy.y.', '..DD.....', 'DD.......'], 1)

// --- The catalogue's art, by item id -------------------------------------------

export const wardrobe: Readonly<Record<string, ItemArt>> = {
  // Hats sit on the head; the head starts on row 3 in every frame.
  cap: { kind: 'sprite', down: { grid: capDown, x: 0, y: 1 }, side: { grid: capSide, x: 0, y: 1 } },
  beanie: { kind: 'sprite', down: { grid: beanie, x: 0, y: -2 } },
  bow: { kind: 'sprite', down: { grid: bow, x: 7, y: 1 }, up: { grid: bow, x: 0, y: 1 }, side: { grid: bow, x: 1, y: 1 } },
  'top-hat': { kind: 'sprite', down: { grid: topHat, x: 0, y: -5 } },
  'graduation-cap': { kind: 'sprite', down: { grid: studentCap, x: 0, y: 0 }, side: { grid: studentCapSide, x: 0, y: 0 } },
  crown: { kind: 'sprite', down: { grid: crown, x: 0, y: -2 } },

  // Clothes repaint the shirt or trousers.
  'blue-sweater': { kind: 'recolor', rows: [{ r: 'u', R: 'm', p: 'U' }] },
  'striped-sweater': {
    kind: 'recolor',
    rows: [
      { r: 'w', R: 'g', p: 'w' },
      { r: 'u', R: 'm', p: 'u' },
    ],
  },
  'star-sweater': { kind: 'recolor', rows: [{ r: 'B', R: 'B', p: 'm' }], dots: { color: 'y', every: 5 } },
  'green-trousers': { kind: 'recolor', rows: [{ b: 'Q', B: 'G' }] },
  'rainbow-trousers': {
    kind: 'recolor',
    rows: [
      { b: 'r', B: 'R' },
      { b: 'Y', B: 'Y' },
      { b: 'y', B: 'Y' },
      { b: 'Q', B: 'G' },
      { b: 'u', B: 'm' },
    ],
  },

  // Back items: behind the body from the front and the side, on the back seen from behind.
  backpack: {
    kind: 'sprite',
    down: { grid: backpackStraps, x: 0, y: 17 },
    up: { grid: backpackBack, x: 3, y: 16 },
    side: { grid: backpackSide, x: 0, y: 16, behind: true },
  },
  cape: {
    kind: 'sprite',
    down: { grid: capeFront, x: -1, y: 16, behind: true },
    up: { grid: capeBack, x: -1, y: 16 },
    side: { grid: capeSide, x: -1, y: 16, behind: true },
  },
  'golden-cape': {
    kind: 'sprite',
    down: { grid: swap(capeFront, gold), x: -1, y: 16, behind: true },
    up: { grid: swap(capeBack, gold), x: -1, y: 16 },
    side: { grid: swap(capeSide, gold), x: -1, y: 16, behind: true },
  },
  wings: {
    kind: 'sprite',
    down: { grid: wingsBehind, x: -5, y: 12, behind: true },
    up: { grid: wingsOnBack, x: -2, y: 13 },
    side: { grid: wingSmall, x: -3, y: 12, behind: true },
  },

  // Held items: in the hand (row 21), behind the body when seen from behind.
  flower: {
    kind: 'sprite',
    down: { grid: flower, x: 10, y: 14 },
    up: { grid: flower, x: -1, y: 14, behind: true },
    side: { grid: flower, x: 5, y: 14 },
  },
  balloon: {
    kind: 'sprite',
    down: { grid: balloon, x: 10, y: -5 },
    up: { grid: balloon, x: -3, y: -5, behind: true },
    // From the side the balloon floats behind the head.
    side: { grid: balloon, x: 5, y: -5, behind: true },
  },
  wand: {
    kind: 'sprite',
    down: { grid: wand, x: 11, y: 10 },
    up: { grid: wand, x: -2, y: 10, behind: true },
    side: { grid: wandSide, x: 7, y: 14 },
  },
}
