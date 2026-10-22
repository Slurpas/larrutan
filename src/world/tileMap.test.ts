import { describe, expect, it } from 'vitest'
import { hubMap } from './hubMap'
import { findPath } from './pathfinding'
import { isWalkable, kindAt, parseMap, stationApproaches, stationNextTo, tryStep, type StationDef } from './tileMap'

const station: StationDef[] = [{ key: 'a', challenge: 'findLetter' }]

describe('parseMap', () => {
  it('reads tiles, the start and stations', () => {
    const map = parseMap(['TTTTT', 'T@aaT', 'T.aaT', 'TTTTT'], station)
    expect(map.cols).toBe(5)
    expect(map.rows).toBe(4)
    expect(map.start).toEqual({ col: 1, row: 1 })
    expect(map.stations[0]?.origin).toEqual({ col: 2, row: 1 })
    expect(map.kinds[2]?.[1]).toBe('grass')
  })

  it('rejects broken maps', () => {
    expect(() => parseMap(['T@T', 'TT'], station)).toThrow(/columns/)
    expect(() => parseMap(['T.T', 'T.T'], [])).toThrow(/no start/)
    expect(() => parseMap(['@@'], [])).toThrow(/more than one start/)
    expect(() => parseMap(['@X'], [])).toThrow(/Unknown map character "X"/)
    expect(() => parseMap(['@a.', '.a.'], station)).toThrow(/2×2 block/)
  })
})

describe('hub map', () => {
  it('is surrounded by obstacles, so the child can never walk off the map', () => {
    for (let col = 0; col < hubMap.cols; col++) {
      expect(isWalkable(hubMap, { col, row: 0 })).toBe(false)
      expect(isWalkable(hubMap, { col, row: hubMap.rows - 1 })).toBe(false)
    }
    for (let row = 0; row < hubMap.rows; row++) {
      expect(isWalkable(hubMap, { col: 0, row })).toBe(false)
      expect(isWalkable(hubMap, { col: hubMap.cols - 1, row })).toBe(false)
    }
  })

  it('has all three challenges, each reachable from the start', () => {
    expect(hubMap.stations.map((s) => s.challenge).sort()).toEqual(['findLetter', 'firstLetter', 'wordPicture'])
    for (const s of hubMap.stations) {
      expect(findPath(hubMap, hubMap.start, stationApproaches(hubMap, s)), s.challenge).not.toBeNull()
    }
  })

  it('starts the child on a walkable tile that is not next to a station', () => {
    expect(isWalkable(hubMap, hubMap.start)).toBe(true)
    expect(stationNextTo(hubMap, hubMap.start)).toBeUndefined()
  })

  it('shows every sign from the start on the smallest iPad (1024×768 at 64 px tiles)', () => {
    // The camera centres on the start, so the visible area reaches 8 tiles left/right and 6 up/down.
    const halfWidth = 1024 / 64 / 2
    const halfHeight = 768 / 64 / 2
    const centre = { x: hubMap.start.col + 0.5, y: hubMap.start.row + 0.5 }
    for (const s of hubMap.stations) {
      // Signs stand about one tile above their block.
      expect(s.origin.col, s.challenge).toBeGreaterThanOrEqual(centre.x - halfWidth)
      expect(s.origin.col + 2, s.challenge).toBeLessThanOrEqual(centre.x + halfWidth)
      expect(s.origin.row - 1, s.challenge).toBeGreaterThanOrEqual(centre.y - halfHeight)
      expect(s.origin.row + 2, s.challenge).toBeLessThanOrEqual(centre.y + halfHeight)
    }
  })
})

describe('tryStep', () => {
  it('moves onto walkable tiles and stays put at obstacles', () => {
    const besideTree = { col: 4, row: 11 }
    expect(kindAt(hubMap, { col: 3, row: 11 })).toBe('tree')
    expect(tryStep(hubMap, besideTree, 'left')).toEqual(besideTree)
    expect(tryStep(hubMap, besideTree, 'right')).toEqual({ col: 5, row: 11 })
  })

  it('never walks into a station', () => {
    const findLetter = hubMap.stations.find((s) => s.challenge === 'findLetter')!
    const below = { col: findLetter.origin.col + 1, row: findLetter.origin.row + 2 }
    expect(tryStep(hubMap, below, 'up')).toEqual(below)
    expect(stationNextTo(hubMap, below)?.challenge).toBe('findLetter')
  })
})
