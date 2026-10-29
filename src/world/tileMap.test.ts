import { describe, expect, it } from 'vitest'
import { hubMap } from './hubMap'
import { findPath } from './pathfinding'
import { arrivalTile, places, townOf, type PlaceId } from './places'
import { banksOf, destinationOf, houseAt, houseNextTo, isWalkable, kindAt, parseMap, splashSpot, stationApproaches, stationNextTo, townSignAt, tryStep, type StationDef, type Tile } from './tileMap'

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

  it('has water to fall into, with a bank to jump in from that can be reached from the start', () => {
    const water = map.kinds.flatMap((kinds, row) => kinds.flatMap((kind, col) => (kind === 'water' ? [{ col, row }] : [])))
    expect(water.length).toBeGreaterThan(0)
    for (const tapped of water) {
      const spot = splashSpot(map, tapped)!
      expect(kindAt(map, spot)).toBe('water')
      expect(findPath(map, map.start, banksOf(map, spot))).not.toBeNull()
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

describe('splashSpot', () => {
  const pond = parseMap(['TTTTTTT', 'T.@...T', 'T.~~~.T', 'T.~~~.T', 'T.~~~TT', 'TTTTTTT'], [])

  it('falls in where the child tapped, at the edge of the water', () => {
    expect(splashSpot(pond, { col: 2, row: 2 })).toEqual({ col: 2, row: 2 })
    expect(banksOf(pond, { col: 2, row: 2 })).toEqual([
      { col: 2, row: 1 },
      { col: 1, row: 2 },
    ])
  })

  it('falls in at the nearest edge for a tap in the middle of the water', () => {
    const spot = splashSpot(pond, { col: 3, row: 3 })!
    expect(Math.abs(spot.col - 3) + Math.abs(spot.row - 3)).toBe(1)
    expect(banksOf(pond, spot).length).toBeGreaterThan(0)
  })

  it('is only for water', () => {
    expect(splashSpot(pond, { col: 1, row: 1 })).toBeUndefined()
    expect(splashSpot(pond, { col: 0, row: 0 })).toBeUndefined()
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
