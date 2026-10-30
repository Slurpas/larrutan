import { describe, expect, it } from 'vitest'
import { hubMap } from './hubMap'
import { findPath, reachableFrom } from './pathfinding'
import { arrivalTile, places, townOf, type PlaceId } from './places'
import { banksOf, destinationOf, houseAt, houseNextTo, isWalkable, kindAt, mishapAt, mishapSpot, mishapTapped, parseMap, stationApproaches, stationNextTo, townSignAt, tryStep, type StationDef, type Tile } from './tileMap'

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

describe.each(Object.entries(places) as [PlaceId, (typeof places)[PlaceId]][])('the %s map', (id, { map, tilePx }) => {
  it('is surrounded by obstacles, so the child can never walk off the map', () => {
    for (let col = 0; col < map.cols; col++) {
      expect(isWalkable(map, { col, row: 0 })).toBe(false)
      expect(isWalkable(map, { col, row: map.rows - 1 })).toBe(false)
    }
    for (let row = 0; row < map.rows; row++) {
      expect(isWalkable(map, { col: 0, row })).toBe(false)
      expect(isWalkable(map, { col: map.cols - 1, row })).toBe(false)
    }
  })

  it('has a sign for each of its challenges (the world: each town), each reachable from the start', () => {
    const wanted = id === 'world' ? Object.keys(places).filter((place) => place !== 'world') : Object.keys(townOf).filter((c) => townOf[c as keyof typeof townOf] === id)
    expect(map.stations.map(destinationOf).sort()).toEqual(wanted.sort())
    for (const s of map.stations) {
      expect(findPath(map, map.start, stationApproaches(map, s)), destinationOf(s)).not.toBeNull()
    }
  })

  it('has houses with one door each, and a tile in front of it reachable from the start', () => {
    for (const kind of ['blueHouse', 'redHouse'] as const) {
      const tiles: Tile[] = map.kinds.flatMap((row, r) => row.flatMap((k, c) => (k === kind ? [{ col: c, row: r }] : [])))
      expect(tiles.length % 9, kind).toBe(0)
      for (const tile of tiles) {
        const house = houseAt(map, tile)!
        expect(kindAt(map, house.door), kind).toBe(kind)
        expect(isWalkable(map, house.front), kind).toBe(true)
        expect(houseNextTo(map, house.front), kind).toEqual(house)
        expect(findPath(map, map.start, [house.front]), kind).not.toBeNull()
      }
    }
    expect(houseAt(map, map.start)).toBeUndefined()
    expect(houseNextTo(map, map.start)).toBeUndefined()
  })

  it('starts the child on a walkable tile that is not next to a sign', () => {
    expect(isWalkable(map, map.start)).toBe(true)
    expect(stationNextTo(map, map.start)).toBeUndefined()
  })

  it('has water to fall into and trees to bonk into, and a tap on any of them (or a rock) leads somewhere the child can walk into it from', () => {
    const tiles = map.kinds.flatMap((kinds, row) => kinds.map((_, col) => ({ col, row })))
    const mishaps = tiles.filter((tile) => mishapAt(map, tile))
    expect(mishaps.some((tile) => mishapAt(map, tile) === 'splash')).toBe(true)
    expect(mishaps.some((tile) => mishapAt(map, tile) === 'bonk')).toBe(true)
    for (const tapped of mishaps) {
      const spot = mishapSpot(map, tapped, reachableFrom(map, map.start))!
      expect(mishapAt(map, spot), `${tapped.col},${tapped.row}`).toBe(mishapAt(map, tapped))
      expect(findPath(map, map.start, banksOf(map, spot)), `${tapped.col},${tapped.row}`).not.toBeNull()
    }
  })

  it('shows every sign from the start on the smallest iPad (1024×768)', () => {
    // The camera centres on the start: at 64 px tiles the visible area reaches 8 tiles left and right and 6 up and down; at 32 px, twice as far.
    const halfWidth = 1024 / tilePx / 2
    const halfHeight = 768 / tilePx / 2
    const centre = { x: map.start.col + 0.5, y: map.start.row + 0.5 }
    for (const s of map.stations) {
      // Signs stand about one tile above their block.
      expect(s.origin.col, destinationOf(s)).toBeGreaterThanOrEqual(centre.x - halfWidth)
      expect(s.origin.col + 2, destinationOf(s)).toBeLessThanOrEqual(centre.x + halfWidth)
      expect(s.origin.row - 1, destinationOf(s)).toBeGreaterThanOrEqual(centre.y - halfHeight)
      expect(s.origin.row + 2, destinationOf(s)).toBeLessThanOrEqual(centre.y + halfHeight)
    }
  })
})

describe('the towns', () => {
  it("has the child's home only in the town of letters, with the red house to knock at", () => {
    const count = (kind: string) => (id: PlaceId) => places[id].map.kinds.flat().filter((k) => k === kind).length / 9
    expect(count('blueHouse')('letters')).toBe(1)
    expect(count('redHouse')('letters')).toBe(1)
    expect(count('blueHouse')('maths')).toBe(0)
    expect(count('blueHouse')('world')).toBe(0)
    expect(count('redHouse')('world')).toBe(0)
  })

  it('puts the child outside a town they leave, and at the start anywhere else', () => {
    for (const town of ['letters', 'maths'] as const) {
      const tile = arrivalTile('world', town)
      expect(isWalkable(places.world.map, tile)).toBe(true)
      expect(destinationOf(stationNextTo(places.world.map, tile)!)).toBe(town)
      expect(arrivalTile(town, 'world')).toEqual(places[town].map.start)
    }
    expect(arrivalTile('world', null)).toEqual(places.world.map.start)
  })

  it("leads from every house of a town on the world map to that town's sign", () => {
    const world = places.world.map
    for (let row = 0; row < world.rows; row++)
      for (let col = 0; col < world.cols; col++) {
        const sign = townSignAt(world, { col, row })
        const kind = kindAt(world, { col, row })
        if (kind !== 'townHouseBlue' && kind !== 'townHouseRed') expect(sign).toBeUndefined()
        else expect(sign && destinationOf(sign), `${col},${row}`).toBe(col < world.cols / 2 ? 'letters' : 'maths')
      }
  })
})

describe('mishapSpot', () => {
  const pond = parseMap(['TTTTTTT', 'T.@.R.T', 'T.~~~.T', 'T.~~~.T', 'T.~~~TT', 'TTTTTTT'], [])

  it('falls into water, bonks into trees and trips over rocks', () => {
    expect(mishapAt(pond, { col: 2, row: 2 })).toBe('splash')
    expect(mishapAt(pond, { col: 0, row: 3 })).toBe('bonk')
    expect(mishapAt(pond, { col: 4, row: 1 })).toBe('trip')
    expect(mishapAt(pond, { col: 1, row: 1 })).toBeUndefined()
    expect(mishapSpot(pond, { col: 4, row: 1 })).toEqual({ col: 4, row: 1 })
  })

  it('falls in where the child tapped, at the edge of the water', () => {
    expect(mishapSpot(pond, { col: 2, row: 2 })).toEqual({ col: 2, row: 2 })
    expect(banksOf(pond, { col: 2, row: 2 })).toEqual([
      { col: 2, row: 1 },
      { col: 1, row: 2 },
    ])
  })

  it('falls in at the nearest edge for a tap in the middle of the water', () => {
    const spot = mishapSpot(pond, { col: 3, row: 3 })!
    expect(Math.abs(spot.col - 3) + Math.abs(spot.row - 3)).toBe(1)
    expect(banksOf(pond, spot).length).toBeGreaterThan(0)
  })

  it('bonks into the nearest tree that can be walked into, for a tap on one deep in the wood', () => {
    expect(banksOf(pond, { col: 0, row: 0 })).toEqual([])
    expect(mishapSpot(pond, { col: 0, row: 0 })).toEqual({ col: 1, row: 0 })
  })

  it('only picks a spot the child can get to', () => {
    const walled = parseMap(['TTTTTT', 'T.T@.T', 'TTTTTT'], [])
    expect(mishapSpot(walled, { col: 0, row: 1 })).toEqual({ col: 0, row: 1 })
    expect(mishapSpot(walled, { col: 0, row: 1 }, reachableFrom(walled, walled.start))).toEqual({ col: 2, row: 1 })
  })

  it('is nothing on grass', () => {
    expect(mishapSpot(pond, { col: 1, row: 1 })).toBeUndefined()
  })
})

describe('mishapTapped', () => {
  // A rock at (2, 1), a tall tree at (4, 2) with its crown on (4, 1), water at (1, 3).
  const map = parseMap(['TTTTTTT', 'T.R...T', 'T.@.Y.T', 'T~....T', 'TTTTTTT'], [])
  const phone = 6 / 16
  const iPad = 2 / 16

  it('counts a tap on the rock, and just beside it, more so on a phone', () => {
    expect(mishapTapped(map, { x: 2.5, y: 1.6 }, iPad)).toEqual({ col: 2, row: 1 })
    expect(mishapTapped(map, { x: 2.5, y: 2.2 }, phone)).toEqual({ col: 2, row: 1 })
    expect(mishapTapped(map, { x: 2.5, y: 2.2 }, iPad)).toBeUndefined()
    expect(mishapTapped(map, { x: 1.7, y: 1.5 }, phone)).toEqual({ col: 2, row: 1 })
  })

  it('leaves the middle of the tiles beside it for walking', () => {
    for (const point of [
      { x: 2.5, y: 2.5 },
      { x: 1.5, y: 1.5 },
      { x: 3.5, y: 1.5 },
    ])
      expect(mishapTapped(map, point, phone)).toBeUndefined()
  })

  it('counts a tall tree where it is drawn, its crown too', () => {
    expect(mishapTapped(map, { x: 4.5, y: 1.3 }, iPad)).toEqual({ col: 4, row: 2 })
    expect(mishapTapped(map, { x: 4.5, y: 2.5 }, iPad)).toEqual({ col: 4, row: 2 })
  })

  it('counts water only when the tap is on it', () => {
    expect(mishapTapped(map, { x: 1.5, y: 3.5 }, iPad)).toEqual({ col: 1, row: 3 })
    expect(mishapTapped(map, { x: 2.1, y: 3.5 }, phone)).toBeUndefined()
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
    const findLetter = hubMap.stations.find((s) => destinationOf(s) === 'findLetter')!
    const below = { col: findLetter.origin.col + 1, row: findLetter.origin.row + 2 }
    expect(tryStep(hubMap, below, 'up')).toEqual(below)
    expect(destinationOf(stationNextTo(hubMap, below)!)).toBe('findLetter')
  })
})
