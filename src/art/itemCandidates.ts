import { Pixels } from './pixels'
import type { ItemArt, Slot } from './wardrobe'

/**
 * Ideas for new things to earn, drawn for the user to pick from on
 * docs/sprites/candidates.png (`npm run sprites`; asked for on 2026-10-25). None is in
 * the game: a picked one moves into ./wardrobe.ts and src/rewards/items.ts, with its two
 * spoken sentences. Seen from the front only; the side and back views come with the move.
 * Pets would need their own feature (one that follows the character on the map).
 */

export interface ItemCandidate {
  id: string
  /** Swedish, as the child would hear it. */
  name: string
  slot: Slot
  art: ItemArt
}

export interface PetCandidate {
  id: string
  name: string
  grid: readonly string[]
}

/** The cap's front, as in ./wardrobe.ts. */
const capDown = [
  '....oooooooo....',
  '...ouuuuuuuuo...',
  '..ouUuuuuuuuuo..',
  '.ouUuuuuuuuuuuo.',
  '.ouuuuuuuuuuuuo.',
  '.ommmmmmmmmmmmo.',
  '..oooooooooooo..',
]
const swap = (grid: readonly string[], colors: Record<string, string>): string[] =>
  grid.map((row) => [...row].map((c) => colors[c] ?? c).join(''))
const front = (grid: readonly string[], x: number, y: number, behind = false): ItemArt => ({
  kind: 'sprite',
  down: { grid, x, y, behind },
})

// --- On the head ---------------------------------------------------------------------

/** Curly orange puffs either side of the head, a tuft on top, and a round red nose. */
const clownWig = (() => {
  const w = new Pixels(22, 16)
  for (const [x, y, r] of [
    [3, 5, 3.2],
    [3.5, 9.5, 2.8],
    [18, 5, 3.2],
    [17.5, 9.5, 2.8],
    [8, 2.2, 2.2],
    [11, 1.6, 2.4],
    [14, 2.2, 2.2],
  ] as const)
    w.ellipse(x, y, r, r, 'Y')
  w.shade('Y', 'y', (x, y) => (x + 2 * y) % 5 === 0)
  w.ellipse(11, 13, 1.5, 1.3, 'r').set(10, 12, 'p')
  return w.outline('o').toGrid()
})()

/** A yellow cap with a little propeller on top. */
const propellerCap = (() => {
  const p = new Pixels(16, 12)
  p.rect(1, 1, 6, 1, 'r').rect(9, 1, 6, 1, 'u').rect(7, 1, 2, 4, 'D')
  p.outline('o')
  return p.draw(swap(capDown, { u: 'y', U: 'e', m: 'Y' }), 0, 5).toGrid()
})()

/** Long white ears, pink inside, on a pink headband. */
const bunnyEars = (() => {
  const b = new Pixels(16, 14)
  for (const x of [4.5, 11.5]) b.ellipse(x, 6, 2.2, 5.6, 'w').ellipse(x, 6.5, 0.9, 3.8, 'p')
  b.rect(2, 11, 12, 2, 'p')
  return b.outline('o').toGrid()
})()

/** A tall pointed hat with stars, for the wand. */
const wizardHat = (() => {
  const h = new Pixels(18, 16)
  h.polygon([[9, 0], [14.5, 13], [3.5, 13]], 'u')
  h.shade('u', 'm', (x) => x >= 10)
  h.rect(0, 13, 18, 2, 'm')
  for (const [x, y] of [[8, 5], [10, 9], [6, 11], [11, 3]] as const) h.set(x, y, 'y')
  return h.outline('o').toGrid()
})()

/** A round white helmet with a shiny blue visor over the face. */
const spaceHelmet = (() => {
  const h = new Pixels(18, 18)
  h.ellipse(9, 8.5, 8.5, 8, 'w')
  h.shade('w', 'g', (x, y) => x + y > 21)
  h.ellipse(9, 10, 5.5, 4.2, 'u')
  h.shade('u', 'U', (x, y) => x + y < 14)
  h.rect(3, 16, 12, 2, 'g')
  return h.outline('o').toGrid()
})()

/** A ring of little flowers round the head. */
const flowerCrown = (() => {
  const f = new Pixels(16, 6)
  f.rect(1, 3, 14, 1, 'G')
  for (const [x, color] of [
    [2.5, 'p'],
    [6, 'w'],
    [10, 'y'],
    [13.5, 'p'],
  ] as const)
    f.ellipse(x, 2.5, 1.6, 1.6, color).set(x, 2.5, 'Y')
  return f.outline('o').toGrid()
})()

/** A brown cowboy hat with a wide curled brim. */
const cowboyHat = (() => {
  const h = new Pixels(22, 9)
  h.ellipse(11, 4, 5, 4, 'd')
  h.rect(6, 4, 10, 3, 'd')
  h.polygon([[0, 5], [3, 7], [19, 7], [22, 5], [19, 8.5], [3, 8.5]], 'd')
  h.shade('d', 'D', (_x, y) => y === 6)
  return h.outline('o').toGrid()
})()

// --- On the back ---------------------------------------------------------------------

/** Two little rockets on the back, with flames: they stick out either side of the body. */
const jetpack = (() => {
  const j = new Pixels(26, 17)
  for (const x of [1, 21]) {
    j.rect(x, 3, 4, 8, 'g')
    j.rect(x + 2, 3, 2, 8, 'n')
    j.polygon([[x, 3], [x + 2, 0], [x + 4, 3]], 'r')
    j.polygon([[x, 11], [x + 4, 11], [x + 2, 16]], 'y')
    j.set(x + 2, 12, 'Y').set(x + 2, 13, 'Y')
  }
  return j.outline('o').toGrid()
})()

/** Green dragon wings rising above the shoulders, pointed and ribbed like Mata draken's. */
const dragonWings = (() => {
  const w = new Pixels(32, 16)
  const left: [number, number][] = [
    [14, 9],
    [1, 0],
    [0, 4],
    [3, 6],
    [1, 10],
    [5, 10],
    [4, 14],
    [9, 12],
    [14, 13],
  ]
  for (const side of [(x: number) => x, (x: number) => 31 - x]) {
    w.polygon(
      left.map(([x, y]) => [side(x), y]),
      'l',
    )
    for (const [x, y] of [
      [1, 1],
      [2, 9],
      [5, 13],
    ] as const)
      w.stroke(
        [
          [side(14), 9],
          [side(x), y],
        ],
        0.4,
        'Q',
      )
  }
  return w.outline('o').toGrid()
})()

// --- In the hand ---------------------------------------------------------------------

/** A cone with a strawberry and a vanilla scoop. */
const iceCream = (() => {
  const c = new Pixels(8, 13)
  c.polygon([[1, 6], [7, 6], [4, 12.5]], 'L')
  c.shade('L', 'd', (x, y) => (x + y) % 3 === 0)
  c.ellipse(4, 4.5, 3, 2.2, 'p').ellipse(4, 2.2, 2.3, 2, 'w')
  return c.outline('o').toGrid()
})()

/** A round red and pink swirl on a white stick. */
const lollipop = (() => {
  const l = new Pixels(9, 15)
  l.rect(4, 7, 1, 8, 'w')
  l.ellipse(4.5, 4, 4, 4, 'r')
  l.shade('r', 'p', (x, y) => Math.floor(Math.hypot(x - 4, y - 3.5) * 0.9) % 2 === 1)
  return l.outline('o').toGrid()
})()

/** A kite high up, in four colours, on a string down to the hand. */
const kite = (() => {
  const k = new Pixels(14, 29)
  k.polygon([[7, 0], [12, 5], [7, 11], [2, 5]], 'r')
  k.shade('r', 'y', (x, y) => x < 7 && y < 5.5)
  k.shade('r', 'u', (x, y) => x >= 7 && y >= 5.5)
  k.shade('r', 'q', (x, y) => x < 7 && y >= 5.5)
  k.outline('o')
  for (let y = 12; y < 28; y++) k.set(7 - Math.floor((y - 12) / 4), y, 'o')
  return k.toGrid()
})()

/** A little brown teddy bear. */
const teddy = (() => {
  const t = new Pixels(10, 11)
  t.ellipse(2, 1.8, 1.4, 1.4, 'd').ellipse(8, 1.8, 1.4, 1.4, 'd')
  t.ellipse(5, 3.6, 3.3, 3, 'd').ellipse(5, 8, 3.5, 2.8, 'd')
  t.ellipse(5, 4.6, 1.4, 1, 'L').ellipse(5, 8.2, 1.8, 1.6, 'L')
  t.set(3.5, 2.8, 'o').set(6.5, 2.8, 'o').set(5, 4, 'o')
  return t.outline('o').toGrid()
})()

/** A magnifying glass with a golden rim, for a detective. */
const magnifier = (() => {
  const m = new Pixels(10, 12)
  m.ellipse(4.5, 4.5, 4, 4, 'Y').ellipse(4.5, 4.5, 2.8, 2.8, 'U')
  m.set(3, 3, 'w').set(4, 2, 'w')
  for (let i = 0; i < 4; i++) m.rect(6.5 + i * 0.8, 7.5 + i * 1.1, 1.5, 1.5, 'D')
  return m.outline('o').toGrid()
})()

export const itemCandidates: readonly ItemCandidate[] = [
  { id: 'clown-wig', name: 'Clownperuk (med näsa)', slot: 'head', art: front(clownWig, -3, 0) },
  { id: 'propeller-cap', name: 'Propellerkeps', slot: 'head', art: front(propellerCap, 0, -4) },
  { id: 'bunny-ears', name: 'Kaninöron', slot: 'head', art: front(bunnyEars, 0, -8) },
  { id: 'wizard-hat', name: 'Trollkarlshatt', slot: 'head', art: front(wizardHat, -1, -10) },
  { id: 'space-helmet', name: 'Rymdhjälm', slot: 'head', art: front(spaceHelmet, -1, 0) },
  { id: 'flower-crown', name: 'Blomsterkrans', slot: 'head', art: front(flowerCrown, 0, 1) },
  { id: 'cowboy-hat', name: 'Cowboyhatt', slot: 'head', art: front(cowboyHat, -3, -2) },
  { id: 'clown-shirt', name: 'Prickig clowntröja', slot: 'top', art: { kind: 'recolor', rows: [{ r: 'y', R: 'Y', p: 'e' }], dots: { color: 'r', every: 4 } } },
  {
    id: 'tiger-shirt',
    name: 'Tigertröja',
    slot: 'top',
    art: {
      kind: 'recolor',
      rows: [
        { r: 'Y', R: 'Y', p: 'y' },
        { r: 'B', R: 'B', p: 'B' },
      ],
    },
  },
  { id: 'clown-trousers', name: 'Prickiga clownbyxor', slot: 'bottoms', art: { kind: 'recolor', rows: [{ b: 'u', B: 'm' }], dots: { color: 'y', every: 3 } } },
  { id: 'jetpack', name: 'Raketryggsäck', slot: 'back', art: front(jetpack, -5, 10, true) },
  { id: 'dragon-wings', name: 'Drakvingar', slot: 'back', art: front(dragonWings, -8, 7, true) },
  { id: 'ice-cream', name: 'Glass', slot: 'held', art: front(iceCream, 11, 10) },
  { id: 'lollipop', name: 'Klubba', slot: 'held', art: front(lollipop, 10, 8) },
  { id: 'kite', name: 'Flygdrake', slot: 'held', art: front(kite, 10, -7) },
  { id: 'teddy', name: 'Nalle', slot: 'held', art: front(teddy, 10, 13) },
  { id: 'magnifier', name: 'Förstoringsglas', slot: 'held', art: front(magnifier, 10, 12) },
]

// --- Pets ----------------------------------------------------------------------------

/** An orange kitten, sitting, with a curled tail. */
const kitten = (() => {
  const k = new Pixels(15, 14)
  k.ellipse(7, 10, 4.5, 3.6, 'Y').ellipse(7, 5.5, 3.8, 3.3, 'Y')
  k.polygon([[3.5, 4], [4, 0.5], [6.5, 3]], 'Y').polygon([[10.5, 4], [10, 0.5], [7.5, 3]], 'Y')
  k.stroke([[11, 12], [13.5, 10], [13.5, 7]], 0.7, 'Y')
  k.shade('Y', 'y', (_x, y) => y >= 8 && y % 2 === 0)
  k.ellipse(7, 7.2, 1.3, 0.8, 'e')
  k.set(5.5, 5.5, 'o').set(8.5, 5.5, 'o').set(7, 6.5, 'c')
  return k.outline('o').toGrid()
})()

/** A brown puppy, sitting: floppy dark ears, a cream muzzle and chest, a wagging tail. */
const puppy = (() => {
  const p = new Pixels(16, 16)
  p.stroke([[12, 12.5], [14.5, 10], [15, 8]], 0.7, 'd')
  p.ellipse(7.5, 12, 4.4, 3.4, 'd').ellipse(7.5, 12.5, 2, 2.4, 'e')
  p.rect(4.5, 13, 1.5, 2.5, 'd').rect(9, 13, 1.5, 2.5, 'd')
  p.ellipse(7.5, 6, 4, 3.6, 'd')
  p.ellipse(3.2, 6.5, 1.5, 3, 'D').ellipse(11.8, 6.5, 1.5, 3, 'D')
  p.ellipse(7.5, 8, 2, 1.4, 'e').set(7, 7, 'o').set(8, 7, 'o')
  p.set(6, 5, 'o').set(9, 5, 'o')
  return p.outline('o').toGrid()
})()

/** A white rabbit with long ears. */
const rabbit = (() => {
  const r = new Pixels(14, 16)
  for (const x of [5, 9]) r.ellipse(x, 3.5, 1.4, 3.6, 'w').ellipse(x, 4, 0.6, 2.4, 'p')
  r.ellipse(7, 12, 4.4, 3.4, 'w').ellipse(7, 8, 3.4, 3, 'w')
  r.shade('w', 'g', (x, y) => y > 13 && x > 7)
  r.set(5.5, 8, 'o').set(8.5, 8, 'o').set(7, 9, 'p')
  r.ellipse(11.5, 13, 1.2, 1.2, 'w')
  return r.outline('o').toGrid()
})()

/** A tiny green dragon, Mata draken's little sibling. */
const babyDragon = (() => {
  const d = new Pixels(16, 15)
  d.polygon([[9, 6], [14, 2], [15, 7], [11, 9]], 'l')
  d.ellipse(8, 10.5, 4.5, 3.6, 'Q').ellipse(5.5, 6, 3.6, 3.2, 'Q')
  d.ellipse(2.5, 7.5, 2.6, 1.8, 'Q')
  d.polygon([[4, 3.5], [4.5, 1], [6, 3]], 'e').polygon([[7, 3.5], [8, 1], [8.5, 3.5]], 'e')
  d.ellipse(8, 11, 2.4, 2, 'e')
  d.stroke([[12, 12.5], [14.5, 12], [15, 10]], 0.6, 'Q')
  d.set(5.5, 5.5, 'w').set(5.5, 6, 'o').set(1, 7, 'G')
  return d.outline('o').toGrid()
})()

export const petCandidates: readonly PetCandidate[] = [
  { id: 'kitten', name: 'Kattunge', grid: kitten },
  { id: 'puppy', name: 'Valp', grid: puppy },
  { id: 'rabbit', name: 'Kanin', grid: rabbit },
  { id: 'baby-dragon', name: 'Liten drake', grid: babyDragon },
]
