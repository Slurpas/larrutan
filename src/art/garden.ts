import { composeCharacter, type Outfit } from './outfit'
import { Pixels } from './pixels'

/**
 * Gräsklipparen: a lawn of 32×32 cells (tall grass, and mowed in light and dark stripes),
 * flowers peeking through the grass here and there, a flower in bloom where a sum was
 * answered, and the child riding a red mower, seen from the side. The sums are UI (Andika).
 */
export const cellSize = 32

/** A fixed pseudo-random number per pixel, so the grass looks wild but the same every time. */
const noise = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

/** Tall grass: blades in three greens, each with a light tip. */
export const tallGrass: readonly string[] = (() => {
  const art = new Pixels(cellSize, cellSize).rect(0, 0, cellSize, cellSize, 'Q')
  for (let x = 0; x < cellSize; x++) for (let y = 0; y < cellSize; y++) if (noise(x, y) < 0.12) art.set(x, y, 'G')
  // Blades: upright strokes three or four pixels long, dark at the root and light at the tip.
  for (let i = 0; i < 44; i++) {
    const x = Math.floor(noise(i, 3) * cellSize)
    const y = Math.floor(noise(i, 7) * (cellSize - 5)) + 4
    const tall = noise(i, 11) < 0.5 ? 3 : 4
    art.rect(x, y - tall + 1, 1, tall, 'G').set(x, y - tall + 1, 'q').set(x, y - tall, 'l')
  }
  return art.toGrid()
})()

/** Mowed grass, short and even; light and dark cells side by side make the stripes of a mowed lawn. */
export function mowedGrass(dark: boolean): string[] {
  const art = new Pixels(cellSize, cellSize).rect(0, 0, cellSize, cellSize, dark ? 'q' : 'l')
  for (let x = 0; x < cellSize; x++)
    for (let y = 0; y < cellSize; y++) if (noise(x + 40, y) < 0.08) art.set(x, y, dark ? 'Q' : 'q')
  return art.toGrid()
}

/** Three flowers peeking through the tall grass, here and there on the lawn. */
export const wildFlowers: readonly string[] = (() => {
  const art = new Pixels(cellSize, cellSize)
  for (const [x, y, petal] of [
    [8, 9, 'y'],
    [22, 11, 'p'],
    [14, 21, 'y'],
  ] as const) {
    art.rect(x, y + 2, 1, 5, 'G').set(x + 1, y + 4, 'G')
    art.ellipse(x + 0.5, y + 0.5, 2.6, 2.6, petal)
    art.rect(x, y, 1, 1, 'Y').set(x - 1, y, 'Y').set(x, y - 1, 'Y')
  }
  return art.outline('o').toGrid()
})()

/** A flower in bloom: where a sum was answered. */
export const bloom: readonly string[] = (() => {
  const art = new Pixels(20, 26)
  art.rect(9, 12, 2, 13, 'G').ellipse(6, 18, 3, 1.6, 'G').ellipse(14, 21, 3, 1.6, 'G')
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4
    art.ellipse(10 + Math.cos(angle) * 5, 8 + Math.sin(angle) * 5, 2.6, 2.6, 'y')
  }
  art.shade('y', 'Y', (x, y) => x + y > 20)
  art.ellipse(10, 8, 3, 3, 'D').set(9, 7, 'd')
  return art.outline('o').toGrid()
})()

/** The red ride-on mower, facing right: a seat at the back, a hood, the steering wheel, a grey cutting deck. */
const mower: readonly string[] = (() => {
  const art = new Pixels(34, 20)
  // The cutting deck, low between the wheels.
  art.rect(6, 14, 22, 3, 'n').rect(6, 16, 22, 1, 'm')
  // The body, with the hood sloping down to the front, and a headlight.
  art.polygon(
    [
      [4, 7],
      [21, 7],
      [30, 9.5],
      [31, 14],
      [4, 14],
    ],
    'r',
  )
  art.shade('r', 'R', (_x, y) => y >= 12)
  art.rect(22, 9, 6, 1, 'R')
  art.rect(29, 10, 1, 2, 'y')
  // The seat, and its back.
  art.rect(5, 5, 8, 2, 'B').rect(4, 1, 2, 6, 'B')
  // The steering wheel on its column.
  art.stroke(
    [
      [19, 7],
      [17, 3],
    ],
    0.55,
    'm',
  )
  art.rect(15, 2, 5, 1, 'B')
  // The wheels: a big one at the back, a small one at the front.
  art.ellipse(9.5, 14.5, 4.6, 4.6, 'B').ellipse(9.5, 14.5, 1.6, 1.6, 'n')
  art.ellipse(26, 15.5, 3.4, 3.4, 'B').ellipse(26, 15.5, 1.2, 1.2, 'n')
  return art.outline('o').toGrid()
})()

/** Where the mower sits on the rider's canvas: the seat at the rider's hips. */
const mowerAt = { x: 4, y: 26 }
export const mowerRiderSize = { width: 38, height: mowerAt.y + 20 } as const

/** The child's character, dressed, riding the mower, facing right or left (src/art/outfit.ts). */
export function mowerWithRider(outfit: Outfit, facing: 'right' | 'left'): string[] {
  const rider = composeCharacter('side', 0, outfit)
  const art = new Pixels(mowerRiderSize.width, mowerRiderSize.height).draw(rider, 1, 0)
  // Below the hips the rider is hidden in the seat.
  art.rect(0, mowerAt.y + 5, mowerRiderSize.width, mowerRiderSize.height, '.')
  art.draw(mower, mowerAt.x, mowerAt.y)
  const grid = art.toGrid()
  return facing === 'right' ? grid : grid.map((row) => [...row].reverse().join(''))
}
