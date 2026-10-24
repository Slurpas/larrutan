import { createRng } from '../random'

/**
 * Where Bygg ordet's bubbles float. Pure, so it is tested for the screens the game is played on.
 */

export interface Bubble {
  /** Unique within the question, e.g. "a-2". */
  id: string
  letter: string
}

export interface Point {
  x: number
  y: number
}

export interface Area {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Where each bubble floats: centres in balanced rows (7 bubbles: 4 and 3), each row
 * centred so they sit between the ones above, never overlapping, with a little
 * seeded wobble so it doesn't look like a grid.
 */
export function bubbleLayout(count: number, area: Area, size: number, seed: number): Point[] {
  const gap = size * 0.3
  // Room for the wobble on every side, so a bubble never leaves the area.
  const w = gap / 4
  const inner = { left: area.left + w, top: area.top + w, width: area.width - 2 * w, height: area.height - 2 * w }
  const perRow = Math.max(1, Math.min(count, Math.floor((inner.width + gap) / (size + gap))))
  const rows = Math.ceil(count / perRow)
  const rowStep = rows > 1 ? Math.min(size * 1.3, (inner.height - size) / (rows - 1)) : 0
  const top = inner.top + size / 2 + (inner.height - size - rowStep * (rows - 1)) / 2
  // Rows can't wobble into each other: at most half the room between them.
  const wobbleY = rows > 1 ? Math.min(w, Math.max(0, (rowStep - size) / 2)) : w
  const rng = createRng(seed)
  const points: Point[] = []
  let placed = 0
  for (let row = 0; row < rows; row++) {
    const inRow = Math.ceil((count - placed) / (rows - row))
    const step = inRow > 1 ? Math.min(size + gap * 2, (inner.width - size) / (inRow - 1)) : 0
    const left = inner.left + size / 2 + (inner.width - size - step * (inRow - 1)) / 2
    for (let i = 0; i < inRow; i++) {
      points.push({ x: left + i * step + (rng() - 0.5) * 2 * w, y: top + row * rowStep + (rng() - 0.5) * 2 * wobbleY })
    }
    placed += inRow
  }
  return points
}
