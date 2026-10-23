import { describe, expect, it } from 'vitest'
import { words } from '../content/words'
import { characterFeetRow, characterFrames, characterHeadTop, characterSize } from './character'
import { tinyTownHouses, tinyTownTiles } from './kenney'
import { palette } from './palette'
import { pictures, pictureSize } from './pictures'
import { rock, waterTile } from './scenery'
import { apple, mouse, signSize, stationSign, sun } from './signs'

/** Every row the same width, and only palette colours (or "." for transparent). */
function problems(grid: readonly string[]): string[] {
  const width = grid[0]?.length ?? 0
  const found: string[] = []
  grid.forEach((row, y) => {
    if (row.length !== width) found.push(`row ${y} is ${row.length} wide, expected ${width}`)
    for (const color of row) if (color !== '.' && !palette[color]) found.push(`row ${y} uses "${color}", not in the palette`)
  })
  return found
}

const allSides = { up: true, down: true, left: true, right: true, upLeft: true, upRight: true, downLeft: true, downRight: true }

describe('sprites', () => {
  it('are well-formed text grids in the shared palette', () => {
    const sprites = {
      ...Object.fromEntries(Object.entries(characterFrames).flatMap(([facing, frames]) => frames.map((frame, i) => [`${facing} ${i}`, frame]))),
      sign: stationSign(false),
      signHighlighted: stationSign(true),
      sun,
      apple,
      mouse,
      rock,
      water: waterTile(allSides, 0),
      ...pictures,
    }
    for (const [name, grid] of Object.entries(sprites)) expect(problems(grid), name).toEqual([])
  })

  it('makes every character frame 16×32 with the feet on the same row', () => {
    for (const frames of Object.values(characterFrames)) {
      expect(frames).toHaveLength(4)
      for (const frame of frames) {
        expect(frame).toHaveLength(characterSize.height)
        expect(frame[0]).toHaveLength(characterSize.width)
        expect(frame[characterFeetRow], 'feet row').toMatch(/o/)
        expect(frame.slice(characterFeetRow + 1).join(''), 'nothing below the feet').toMatch(/^\.*$/)
        expect(frame.slice(0, characterHeadTop).join(''), 'nothing above the head').toMatch(/^\.*$/)
      }
    }
  })

  it('fits each sign in its station block (2×2 tiles) and each tile in 16×16', () => {
    expect(stationSign(false)).toHaveLength(signSize.height)
    expect(stationSign(false)[0]).toHaveLength(signSize.width)
    for (const grid of [rock, waterTile(allSides, 1)]) {
      expect(grid).toHaveLength(16)
      expect(grid[0]).toHaveLength(16)
    }
  })

  it('has a 32×32 picture for every word, and a word for every picture', () => {
    expect(Object.keys(pictures).sort()).toEqual(words.map((word) => word.id).sort())
    for (const [id, grid] of Object.entries(pictures)) {
      expect(grid, id).toHaveLength(pictureSize)
      expect(grid[0], id).toHaveLength(pictureSize)
    }
  })

  it('keeps every picture inside its frame: only the outline may touch the edge', () => {
    for (const [id, grid] of Object.entries(pictures)) {
      const edge = [grid[0], grid[pictureSize - 1], grid.map((row) => row[0]).join(''), grid.map((row) => row[pictureSize - 1]).join('')]
      for (const line of edge) expect(line, id).toMatch(/^[.o]*$/)
    }
  })

  it('only uses tiles that exist in the Kenney sheet (12 × 11 tiles)', () => {
    const frames = [...Object.values(tinyTownTiles), ...Object.values(tinyTownHouses).flat(2)]
    for (const frame of frames) expect(frame).toBeLessThan(12 * 11)
  })
})
