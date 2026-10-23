import { describe, expect, it } from 'vitest'
import { tinyTownHouses, tinyTownTiles } from '../art/kenney'
import { groundTile, waterKey } from './groundTiles'
import { hubMap } from './hubMap'
import { kindAt, parseMap } from './tileMap'

const pond = parseMap(
  [
    'TTTTTT', //
    'T....T',
    'T.~~.T',
    'T.~~.T',
    'T..@.T',
    'TTTTTT',
  ],
  [],
)

describe('ground tiles', () => {
  it('gives water tiles the land around them, so banks and corners line up', () => {
    const topLeft = groundTile(pond, { col: 2, row: 2 })
    expect(topLeft).toMatchObject({ kind: 'water', edges: { up: true, left: true, right: false, down: false, upLeft: true, downRight: false } })
    const bottomRight = groundTile(pond, { col: 3, row: 3 })
    expect(bottomRight).toMatchObject({ kind: 'water', edges: { up: false, left: false, right: true, down: true, downRight: true } })
  })

  it('draws paths, flowers, trees, bushes, mushrooms and rocks with their own tiles', () => {
    const map = parseMap(['T,=@mBRY'], [])
    const at = (col: number) => groundTile(map, { col, row: 0 })
    expect(at(1)).toEqual({ kind: 'ground', frame: tinyTownTiles.grassFlowers })
    expect(at(2)).toEqual({ kind: 'ground', frame: tinyTownTiles.stonePath })
    expect(at(4)).toEqual({ kind: 'decor', under: tinyTownTiles.grass, decor: tinyTownTiles.mushrooms })
    expect(at(5)).toEqual({ kind: 'decor', under: tinyTownTiles.grass, decor: tinyTownTiles.roundTree })
    expect(at(6)).toEqual({ kind: 'decor', under: tinyTownTiles.grass, decor: 'rock' })
    expect(at(7)).toMatchObject({ kind: 'tallTree', under: tinyTownTiles.grass })
    expect([tinyTownTiles.tree, tinyTownTiles.roundTree]).toContain((at(0) as { decor: number }).decor)
  })

  it('puts each house together from its nine parts', () => {
    const map = parseMap(['@HHH.', '.HHH.', '.HHH.'], [])
    const frames = [0, 1, 2].map((row) => [1, 2, 3].map((col) => (groundTile(map, { col, row }) as { frame: number }).frame))
    expect(frames).toEqual(tinyTownHouses.blueHouse)
  })

  it('has only whole 3×3 houses on the hub map', () => {
    for (let row = 0; row < hubMap.rows; row++)
      for (let col = 0; col < hubMap.cols; col++) {
        const kind = kindAt(hubMap, { col, row })
        if (kind !== 'blueHouse' && kind !== 'redHouse') continue
        const frame = (groundTile(hubMap, { col, row }) as { frame: number }).frame
        expect(tinyTownHouses[kind].flat(), `${col},${row}`).toContain(frame)
      }
    const houseTiles = hubMap.kinds.flat().filter((kind) => kind === 'blueHouse' || kind === 'redHouse')
    expect(houseTiles.length % 9).toBe(0)
  })

  it('looks the same every time, with some variety across the map', () => {
    const draw = () => hubMap.kinds.flatMap((row, r) => row.map((_, c) => groundTile(hubMap, { col: c, row: r })))
    const tiles = draw()
    expect(draw()).toEqual(tiles)
    const looks = new Set(tiles.map((t) => (t.kind === 'ground' ? t.frame : t.kind === 'decor' ? t.decor : t.kind)))
    for (const look of [tinyTownTiles.grass, tinyTownTiles.grassTufts, tinyTownTiles.grassFlowers, tinyTownTiles.stonePath, 'rock', 'water', 'tallTree'])
      expect(looks).toContain(look)
  })

  it('names each water shape once', () => {
    const edges = { up: true, down: false, left: true, right: false, upLeft: true, upRight: false, downLeft: false, downRight: false }
    expect(waterKey(edges, 0)).toBe('water-up-left-upLeft-0')
    expect(waterKey({ ...edges, up: false, left: false, upLeft: false }, 1)).toBe('water-open-1')
  })
})
