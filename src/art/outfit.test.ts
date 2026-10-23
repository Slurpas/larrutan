import { describe, expect, it } from 'vitest'
import { items } from '../rewards/items'
import { characterFrames, characterSize } from './character'
import { composeCharacter, outfitFeetRow, outfitKey, outfitSize } from './outfit'
import { palette } from './palette'
import { clothingMask, wardrobe, type PlacedSprite } from './wardrobe'

const facings = ['down', 'up', 'side', 'left'] as const
/** Where the 16×32 character sits on the larger canvas: centred, feet at the bottom. */
const margin = { x: (outfitSize.width - characterSize.width) / 2, y: outfitSize.height - characterSize.height }

const pixelAt = (grid: readonly string[], x: number, y: number) => grid[y]?.[x] ?? '.'

/** The non-transparent pixels of a sprite, as canvas positions. */
function pixelsOf({ grid, x, y }: PlacedSprite) {
  return grid.flatMap((row, dy) =>
    [...row].flatMap((color, dx) => (color === '.' ? [] : [{ x: x + dx + margin.x, y: y + dy + margin.y, color }])),
  )
}

describe('wardrobe art', () => {
  it('has art for every item, and an item for every piece of art', () => {
    expect(Object.keys(wardrobe).sort()).toEqual(items.map((item) => item.id).sort())
  })

  it('recolours exactly the clothes that cover the body (tops and trousers)', () => {
    for (const item of items) expect(wardrobe[item.id]?.kind, item.id).toBe(clothingMask[item.slot] ? 'recolor' : 'sprite')
  })

  it('uses only palette colours and stays inside the canvas', () => {
    for (const [id, art] of Object.entries(wardrobe)) {
      if (art.kind === 'recolor') {
        const colors = [...art.rows.flatMap((row) => Object.values(row)), ...(art.dots ? [art.dots.color] : [])]
        for (const color of colors) expect(palette[color], `${id} uses "${color}"`).toBeDefined()
        continue
      }
      for (const sprite of [art.down, art.up, art.side]) {
        if (!sprite) continue
        const width = sprite.grid[0]?.length ?? 0
        for (const row of sprite.grid) {
          expect(row, `${id}: every row as wide as the first`).toHaveLength(width)
          for (const color of row) if (color !== '.') expect(palette[color], `${id} uses "${color}"`).toBeDefined()
        }
        expect(sprite.x + margin.x, `${id} left edge`).toBeGreaterThanOrEqual(0)
        expect(sprite.x + margin.x + width, `${id} right edge`).toBeLessThanOrEqual(outfitSize.width)
        expect(sprite.y + margin.y, `${id} top edge`).toBeGreaterThanOrEqual(0)
        expect(sprite.y + margin.y + sprite.grid.length, `${id} bottom edge`).toBeLessThanOrEqual(outfitSize.height)
      }
    }
  })
})

describe('composeCharacter', () => {
  it('draws the plain character in the middle of the canvas, feet on the bottom row', () => {
    const grid = composeCharacter('down', 0, {})
    expect(grid).toHaveLength(outfitSize.height)
    for (const row of grid) expect(row).toHaveLength(outfitSize.width)
    characterFrames.down[0]?.forEach((row, y) =>
      [...row].forEach((color, x) => expect(pixelAt(grid, x + margin.x, y + margin.y)).toBe(color)),
    )
    expect(grid[outfitFeetRow]).toMatch(/o/)
  })

  it('keeps the same size and feet row for every item, facing and walk frame', () => {
    for (const item of items)
      for (const facing of facings)
        for (let frame = 0; frame < 4; frame++) {
          const grid = composeCharacter(facing, frame, { [item.slot]: item.id })
          expect(grid, `${item.id} ${facing} ${frame}`).toHaveLength(outfitSize.height)
          expect(grid[0], `${item.id} ${facing} ${frame}`).toHaveLength(outfitSize.width)
          expect(grid[outfitFeetRow], `${item.id} ${facing} ${frame} feet`).toMatch(/o/)
        }
  })

  it('mirrors the side view for facing left', () => {
    const outfit = { head: 'cap', held: 'wand', back: 'backpack' }
    const right = composeCharacter('side', 1, outfit)
    const left = composeCharacter('left', 1, outfit)
    expect(left).toEqual(right.map((row) => [...row].reverse().join('')))
  })

  it('draws a cape seen from the front behind the body, and a crown on top of it', () => {
    const plain = composeCharacter('down', 0, {})
    const caped = composeCharacter('down', 0, { back: 'cape' })
    plain.forEach((row, y) =>
      [...row].forEach((color, x) => {
        if (color !== '.') expect(pixelAt(caped, x, y), `body at ${x},${y}`).toBe(color)
      }),
    )
    expect(caped).not.toEqual(plain)

    const crown = wardrobe.crown
    if (crown?.kind !== 'sprite') throw new Error('the crown is a sprite')
    const crowned = composeCharacter('down', 0, { head: 'crown' })
    for (const { x, y, color } of pixelsOf(crown.down)) expect(pixelAt(crowned, x, y), `crown at ${x},${y}`).toBe(color)
  })

  it('repaints only the shirt for a sweater and only the trousers for trousers', () => {
    const plain = composeCharacter('side', 2, {})
    for (const [slot, id] of [
      ['top', 'blue-sweater'],
      ['bottoms', 'green-trousers'],
    ] as const) {
      const dressed = composeCharacter('side', 2, { [slot]: id })
      const mask = clothingMask[slot] ?? []
      let changed = 0
      plain.forEach((row, y) =>
        [...row].forEach((color, x) => {
          if (pixelAt(dressed, x, y) === color) return
          changed++
          expect(mask, `${id} changed ${x},${y}`).toContain(color)
        }),
      )
      expect(changed, id).toBeGreaterThan(0)
    }
  })

  it('dresses a top and trousers independently, whatever colours they use', () => {
    // The star sweater is dark blue, a colour the trousers repaint: it must stay a sweater.
    for (const facing of facings)
      for (let frame = 0; frame < 4; frame++) {
        const top = composeCharacter(facing, frame, { top: 'star-sweater' })
        const bottoms = composeCharacter(facing, frame, { bottoms: 'rainbow-trousers' })
        const plain = composeCharacter(facing, frame, {})
        const both = composeCharacter(facing, frame, { top: 'star-sweater', bottoms: 'rainbow-trousers' })
        plain.forEach((row, y) =>
          [...row].forEach((color, x) => {
            const expected = (clothingMask.top ?? []).includes(color) ? pixelAt(top, x, y) : pixelAt(bottoms, x, y)
            expect(pixelAt(both, x, y), `${facing} ${frame} at ${x},${y}`).toBe(expected)
          }),
        )
      }
  })
})

describe('outfitKey', () => {
  it('names an outfit the same way whatever order it was built in', () => {
    expect(outfitKey({ head: 'cap', back: 'cape' })).toBe(outfitKey({ back: 'cape', head: 'cap' }))
    expect(outfitKey({ head: 'cap', back: 'cape' })).toBe('back=cape|head=cap')
    expect(outfitKey({})).toBe('plain')
  })
})
