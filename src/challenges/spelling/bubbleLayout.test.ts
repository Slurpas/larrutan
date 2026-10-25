import { describe, expect, it } from 'vitest'
import { bubbleLayout } from './bubbleLayout'

describe('where the bubbles float', () => {
  // The sky above the meadow, below the top bar, on the screens the game is played on.
  const screens = {
    'iPad landscape': { area: { left: 180, top: 170, width: 860, height: 470 }, size: 140 },
    'iPad portrait': { area: { left: 40, top: 170, width: 730, height: 720 }, size: 120 },
    desktop: { area: { left: 200, top: 160, width: 1040, height: 400 }, size: 120 },
    'small laptop': { area: { left: 150, top: 150, width: 840, height: 330 }, size: 96 },
  }

  it('keeps every bubble inside the sky and apart from the others', () => {
    for (const [name, { area, size }] of Object.entries(screens))
      // Up to five letters and four extra ones.
      for (const count of [5, 7, 8, 9])
        for (const seed of [1, 2, 3]) {
          const points = bubbleLayout(count, area, size, seed)
          expect(points, name).toHaveLength(count)
          for (const p of points) {
            expect(p.x - size / 2, `${name}: left`).toBeGreaterThanOrEqual(area.left - 1)
            expect(p.x + size / 2, `${name}: right`).toBeLessThanOrEqual(area.left + area.width + 1)
            expect(p.y - size / 2, `${name}: top`).toBeGreaterThanOrEqual(area.top - 1)
            expect(p.y + size / 2, `${name}: bottom`).toBeLessThanOrEqual(area.top + area.height + 1)
          }
          for (const [i, a] of points.entries())
            for (const b of points.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y), `${name}: overlap`).toBeGreaterThanOrEqual(size)
        }
  })
})
