import { describe, expect, it } from 'vitest'
import { findPath, nearestWalkable } from './pathfinding'
import { isWalkable, parseMap } from './tileMap'

// A wall with one gap forces a detour.
const map = parseMap(
  [
    'TTTTTTT', //
    'T@....T',
    'TTTT..T',
    'T.....T',
    'T.~~..T',
    'TTTTTTT',
  ],
  [],
)

describe('findPath', () => {
  it('walks around obstacles on the shortest route', () => {
    const path = findPath(map, map.start, [{ col: 1, row: 3 }])!
    expect(path.at(-1)).toEqual({ col: 1, row: 3 })
    expect(path).toHaveLength(8)
    for (const tile of path) expect(isWalkable(map, tile)).toBe(true)
  })

  it('moves one tile at a time, never diagonally', () => {
    const path = findPath(map, map.start, [{ col: 1, row: 4 }])!
    let previous = map.start
    for (const tile of path) {
      expect(Math.abs(tile.col - previous.col) + Math.abs(tile.row - previous.row)).toBe(1)
      previous = tile
    }
  })

  it('heads for the nearest of several goals', () => {
    const path = findPath(map, map.start, [{ col: 1, row: 4 }, { col: 3, row: 1 }])!
    expect(path.at(-1)).toEqual({ col: 3, row: 1 })
  })

  it('returns an empty path when already there, and null when unreachable', () => {
    expect(findPath(map, map.start, [map.start])).toEqual([])
    expect(findPath(map, map.start, [{ col: 2, row: 4 }])).toBeNull() // water
  })
})

describe('nearestWalkable', () => {
  it('turns a tap on an obstacle into the closest place to stand', () => {
    expect(nearestWalkable(map, { col: 2, row: 2 })).toEqual({ col: 2, row: 1 })
    expect(nearestWalkable(map, { col: 3, row: 3 })).toEqual({ col: 3, row: 3 })
  })
})
