import type { ChallengeId } from '../challenges/challengeIds'

export type TileKind =
  | 'grass'
  | 'flowers'
  | 'mushrooms'
  | 'path'
  | 'tree'
  | 'tallTree'
  | 'bush'
  | 'rock'
  | 'water'
  | 'blueHouse'
  | 'redHouse'
  /** A house of a town on the world map: it can't be entered, and tapping it walks to its town's sign. */
  | 'townHouseBlue'
  | 'townHouseRed'
  | 'station'

export interface Tile {
  col: number
  row: number
}

/** The towns on the world map, each with its own map of games (the user's idea, 2026-10-27). */
export type TownId = 'letters' | 'maths'

/** What a sign opens: a challenge, or (on the world map) a town. */
export type Destination = { challenge: ChallengeId } | { town: TownId }

export type StationDef = {
  /** The grid character that marks this station's 2×2 block. */
  key: string
} & Destination

export type Station = StationDef & {
  /** Top-left tile of the 2×2 block. */
  origin: Tile
  tiles: Tile[]
}

/** A sign's challenge or town, as one id (the two never share a name). */
export function destinationOf(station: Station): ChallengeId | TownId {
  return 'challenge' in station ? station.challenge : station.town
}

export interface TileMap {
  cols: number
  rows: number
  kinds: TileKind[][]
  start: Tile
  stations: Station[]
}

/** What each character in a map grid means. Station keys are added from the station list. */
const legend: Record<string, TileKind> = {
  '.': 'grass',
  ',': 'flowers',
  m: 'mushrooms',
  '=': 'path',
  '@': 'path',
  T: 'tree',
  Y: 'tallTree',
  B: 'bush',
  R: 'rock',
  '~': 'water',
  H: 'blueHouse',
  h: 'redHouse',
  Q: 'townHouseBlue',
  K: 'townHouseRed',
}

const walkable: ReadonlySet<TileKind> = new Set(['grass', 'flowers', 'mushrooms', 'path'])

/** Turns a text grid into a map. Throws on anything malformed, so a broken map never loads. */
export function parseMap(grid: readonly string[], stationDefs: readonly StationDef[]): TileMap {
  const rows = grid.length
  const cols = grid[0]?.length ?? 0
  const stationKeys = new Map(stationDefs.map((def) => [def.key, def]))
  const stationTiles = new Map<string, Tile[]>()
  let start: Tile | undefined

  const kinds = grid.map((line, row) => {
    if (line.length !== cols) throw new Error(`Map row ${row} has ${line.length} columns, expected ${cols}`)
    return [...line].map((char, col): TileKind => {
      if (char === '@') {
        if (start) throw new Error('Map has more than one start (@)')
        start = { col, row }
      }
      if (stationKeys.has(char)) {
        stationTiles.set(char, [...(stationTiles.get(char) ?? []), { col, row }])
        return 'station'
      }
      const kind = legend[char]
      if (!kind) throw new Error(`Unknown map character "${char}" at column ${col}, row ${row}`)
      return kind
    })
  })

  if (!start) throw new Error('Map has no start (@)')

  const stations = stationDefs.map((def): Station => {
    const tiles = stationTiles.get(def.key) ?? []
    const origin = tiles[0]
    const isBlock =
      origin &&
      tiles.length === 4 &&
      [0, 1].every((dr) => [0, 1].every((dc) => tiles.some((t) => t.col === origin.col + dc && t.row === origin.row + dr)))
    if (!origin || !isBlock) throw new Error(`Station "${def.key}" must be exactly one 2×2 block`)
    return { ...def, origin, tiles }
  })

  return { cols, rows, kinds, start, stations }
}

export function kindAt(map: TileMap, tile: Tile): TileKind | undefined {
  return map.kinds[tile.row]?.[tile.col]
}

export function isWalkable(map: TileMap, tile: Tile): boolean {
  const kind = kindAt(map, tile)
  return kind !== undefined && walkable.has(kind)
}

export function sameTile(a: Tile, b: Tile): boolean {
  return a.col === b.col && a.row === b.row
}

export const directions = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
} as const

export type Direction = keyof typeof directions

export function step(tile: Tile, direction: Direction): Tile {
  const delta = directions[direction]
  return { col: tile.col + delta.col, row: tile.row + delta.row }
}

/** One keyboard step: moves if the next tile is walkable, otherwise stays put. */
export function tryStep(map: TileMap, tile: Tile, direction: Direction): Tile {
  const next = step(tile, direction)
  return isWalkable(map, next) ? next : tile
}

/** Walkable tiles touching the station (including diagonals), where the child can stand to open it. */
export function stationApproaches(map: TileMap, station: Station): Tile[] {
  const result: Tile[] = []
  for (const tile of station.tiles) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const near = { col: tile.col + dc, row: tile.row + dr }
        if (isWalkable(map, near) && !result.some((t) => sameTile(t, near))) result.push(near)
      }
    }
  }
  return result
}

export function stationAt(map: TileMap, tile: Tile): Station | undefined {
  return map.stations.find((station) => station.tiles.some((t) => sameTile(t, tile)))
}

export type HouseKind = 'blueHouse' | 'redHouse'

/** A house: its front door (the middle of its bottom row), and the tile in front of it, where the child stands to go in. */
export interface House {
  kind: HouseKind
  door: Tile
  front: Tile
}

/** Where a tile sits within its 3×3 house, counted from the house's top-left corner. */
export function positionInHouse(map: TileMap, tile: Tile, kind: TileKind): { dc: number; dr: number } {
  let dc = 0
  while (kindAt(map, { col: tile.col - dc - 1, row: tile.row }) === kind) dc++
  let dr = 0
  while (kindAt(map, { col: tile.col, row: tile.row - dr - 1 }) === kind) dr++
  return { dc: dc % 3, dr: dr % 3 }
}

/** The house a tile belongs to, if any. */
export function houseAt(map: TileMap, tile: Tile): House | undefined {
  const kind = kindAt(map, tile)
  if (kind !== 'blueHouse' && kind !== 'redHouse') return undefined
  const { dc, dr } = positionInHouse(map, tile, kind)
  const door = { col: tile.col - dc + 1, row: tile.row - dr + 2 }
  return { kind, door, front: { col: door.col, row: door.row + 1 } }
}

/** The house whose door the child is standing in front of, if any. */
export function houseNextTo(map: TileMap, tile: Tile): House | undefined {
  const house = houseAt(map, { col: tile.col, row: tile.row - 1 })
  return house && sameTile(house.front, tile) ? house : undefined
}

/** On the world map, a town's houses lead to its sign: for a town house, the nearest sign that opens a town. */
export function townSignAt(map: TileMap, tile: Tile): Station | undefined {
  const kind = kindAt(map, tile)
  if (kind !== 'townHouseBlue' && kind !== 'townHouseRed') return undefined
  const distance = (station: Station) => Math.hypot(station.origin.col + 0.5 - tile.col, station.origin.row + 0.5 - tile.row)
  return map.stations.filter((station) => 'town' in station).sort((a, b) => distance(a) - distance(b))[0]
}

/** The land beside a tile (not diagonally): where the child can jump in from, or climb out to. */
export function banksOf(map: TileMap, tile: Tile): Tile[] {
  return Object.values(directions)
    .map((delta) => ({ col: tile.col + delta.col, row: tile.row + delta.row }))
    .filter((near) => isWalkable(map, near))
}

/**
 * Where the child falls in for a tap on water (src/world/splash.ts): the water tile nearest
 * the tap that touches land, so a tap in the middle of the pond lands at its edge.
 */
export function splashSpot(map: TileMap, tapped: Tile): Tile | undefined {
  if (kindAt(map, tapped) !== 'water') return undefined
  let best: Tile | undefined
  let bestDistance = Infinity
  for (let row = 0; row < map.rows; row++)
    for (let col = 0; col < map.cols; col++) {
      const tile = { col, row }
      if (kindAt(map, tile) !== 'water' || banksOf(map, tile).length === 0) continue
      const distance = (col - tapped.col) ** 2 + (row - tapped.row) ** 2
      if (distance < bestDistance) {
        best = tile
        bestDistance = distance
      }
    }
  return best
}

/** The station the child is standing next to, if any. */
export function stationNextTo(map: TileMap, tile: Tile): Station | undefined {
  return map.stations.find((station) => stationApproaches(map, station).some((t) => sameTile(t, tile)))
}
