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

/** A party hat: a striped cone with a pompom. */
const partyHat = (() => {
  const p = new Pixels(16, 14)
  p.polygon([[8, 3], [12.6, 13], [3.4, 13]], 'r')
  p.shade('r', 'y', (_x, y) => y % 4 === 0 || y % 4 === 1)
  p.ellipse(8, 3, 2, 2, 'w')
  return p.outline('o').toGrid()
})()

/** A viking helmet: a steel dome with a band and two horns. */
const vikingHelmet = (() => {
  const v = new Pixels(22, 11)
  v.polygon([[3, 8], [0.5, 1.5], [2.5, 1], [5.5, 7]], 'e').polygon([[19, 8], [21.5, 1.5], [19.5, 1], [16.5, 7]], 'e')
  v.shade('e', 'L', (x) => x <= 2 || x >= 19)
  v.ellipse(11, 9, 7, 6.5, 'n')
  v.rect(0, 10, 22, 1, '.')
  v.shade('n', 'g', (x, y) => x < 9 && y < 7)
  v.rect(4, 8, 14, 2, 'm').set(11, 4, 'm').set(11, 5, 'm').set(11, 6, 'm').set(11, 7, 'm')
  return v.outline('o').toGrid()
})()

/** A pirate hat: a black hat with an upturned brim and a gold edge. */
const pirateHat = (() => {
  const h = new Pixels(20, 10)
  h.ellipse(10, 6, 6, 4.5, 'B')
  h.polygon([[1, 8], [5, 4], [10, 6.5], [15, 4], [19, 8], [10, 9]], 'B')
  h.shade('B', 'm', (x, y) => x < 8 && y < 5)
  h.rect(3, 8, 14, 1, 'y')
  h.set(10, 4, 'w').set(9, 5, 'w').set(11, 5, 'w')
  return h.outline('o').toGrid()
})()

/** A chef's hat: a tall white puff on a band. */
const chefHat = (() => {
  const c = new Pixels(16, 13)
  c.ellipse(5, 4.5, 3.5, 3.5, 'w').ellipse(11, 4.5, 3.5, 3.5, 'w').ellipse(8, 3.5, 4, 3.5, 'w')
  c.rect(4, 5, 8, 6, 'w')
  c.shade('w', 'g', (x, y) => x >= 10 && y >= 4)
  c.rect(4, 10, 8, 2, 'g')
  return c.outline('o').toGrid()
})()

/** A recoloured cap. */
const capIn = (colors: Record<string, string>) => ({ down: swap(capDown, colors), side: swap(capSide, colors) })
const redCap = capIn({ u: 'r', U: 'p', m: 'R' })
const greenCap = capIn({ u: 'G', U: 'Q', m: 'm' })

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
const green = { r: 'Q', R: 'G' }
/** Repaints a cape's red, two rows at a time, in the colours of the rainbow. */
const rainbowRows = (grid: readonly string[]): string[] => {
  const bands = [['r', 'R'], ['Y', 'Y'], ['y', 'Y'], ['q', 'G'], ['u', 'm']] as const
  return grid.map((row, y) => {
    const [light, dark] = bands[Math.floor(y / 2) % bands.length]!
    return [...row].map((c) => (c === 'r' ? light : c === 'R' ? dark : c)).join('')
  })
}

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

/** A sunflower: big yellow petals round a brown middle, on a long stem. */
const sunflower = (() => {
  const f = new Pixels(11, 18)
  f.rect(5, 8, 1, 10, 'G').rect(3, 12, 2, 1, 'Q')
  f.ellipse(5.5, 5, 4.5, 4.5, 'y')
  f.shade('y', 'Y', (x, y) => (x + y) % 3 === 0)
  f.ellipse(5.5, 5, 2, 2, 'D')
  return f.outline('o').toGrid()
})()
const blue = { r: 'u', R: 'm', p: 'U' }

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
  'red-cap': { kind: 'sprite', down: { grid: redCap.down, x: 0, y: 1 }, side: { grid: redCap.side, x: 0, y: 1 } },
  'green-cap': { kind: 'sprite', down: { grid: greenCap.down, x: 0, y: 1 }, side: { grid: greenCap.side, x: 0, y: 1 } },
  'party-hat': { kind: 'sprite', down: { grid: partyHat, x: 0, y: -8 } },
  'viking-helmet': { kind: 'sprite', down: { grid: vikingHelmet, x: -3, y: -3 } },
  'pirate-hat': { kind: 'sprite', down: { grid: pirateHat, x: -2, y: -2 } },
  'chef-hat': { kind: 'sprite', down: { grid: chefHat, x: 0, y: -7 } },

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
  'yellow-sweater': { kind: 'recolor', rows: [{ r: 'y', R: 'Y', p: 'e' }] },
  'pink-sweater': { kind: 'recolor', rows: [{ r: 'p', R: 'c', p: 'e' }] },
  'green-striped-sweater': {
    kind: 'recolor',
    rows: [
      { r: 'w', R: 'g', p: 'w' },
      { r: 'q', R: 'G', p: 'q' },
    ],
  },
  'red-trousers': { kind: 'recolor', rows: [{ b: 'r', B: 'R' }] },
  'yellow-trousers': { kind: 'recolor', rows: [{ b: 'y', B: 'Y' }] },
  'star-trousers': { kind: 'recolor', rows: [{ b: 'B', B: 'B' }], dots: { color: 'y', every: 4 } },
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
  'red-backpack': {
    kind: 'sprite',
    down: { grid: swap(backpackStraps, { D: 'R' }), x: 0, y: 17 },
    up: { grid: swap(backpackBack, { L: 'p', d: 'r', D: 'R' }), x: 3, y: 16 },
    side: { grid: swap(backpackSide, { L: 'p', d: 'r', D: 'R' }), x: 0, y: 16, behind: true },
  },
  'green-cape': {
    kind: 'sprite',
    down: { grid: swap(capeFront, green), x: -1, y: 16, behind: true },
    up: { grid: swap(capeBack, green), x: -1, y: 16 },
    side: { grid: swap(capeSide, green), x: -1, y: 16, behind: true },
  },
  'rainbow-cape': {
    kind: 'sprite',
    down: { grid: rainbowRows(capeFront), x: -1, y: 16, behind: true },
    up: { grid: rainbowRows(capeBack), x: -1, y: 16 },
    side: { grid: rainbowRows(capeSide), x: -1, y: 16, behind: true },
  },
  'butterfly-wings': {
    kind: 'sprite',
    down: { grid: swap(wingsBehind, { w: 'p', g: 'c' }), x: -5, y: 12, behind: true },
    up: { grid: swap(wingsOnBack, { w: 'p', g: 'c' }), x: -2, y: 13 },
    side: { grid: swap(wingSmall, { w: 'p', g: 'c' }), x: -3, y: 12, behind: true },
  },
  'gold-wings': {
    kind: 'sprite',
    down: { grid: swap(wingsBehind, { w: 'y', g: 'Y' }), x: -5, y: 12, behind: true },
    up: { grid: swap(wingsOnBack, { w: 'y', g: 'Y' }), x: -2, y: 13 },
    side: { grid: swap(wingSmall, { w: 'y', g: 'Y' }), x: -3, y: 12, behind: true },
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
  'blue-balloon': {
    kind: 'sprite',
    down: { grid: swap(balloon, blue), x: 10, y: -5 },
    up: { grid: swap(balloon, blue), x: -3, y: -5, behind: true },
    side: { grid: swap(balloon, blue), x: 5, y: -5, behind: true },
  },
  sunflower: {
    kind: 'sprite',
    down: { grid: sunflower, x: 10, y: 9 },
    up: { grid: sunflower, x: -1, y: 9, behind: true },
    side: { grid: sunflower, x: 5, y: 9 },
  },
  wand: {
    kind: 'sprite',
    down: { grid: wand, x: 11, y: 10 },
    up: { grid: wand, x: -2, y: 10, behind: true },
    side: { grid: wandSide, x: 7, y: 14 },
  },
}
