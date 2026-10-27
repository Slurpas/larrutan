import { tinyTownHouses, tinyTownTiles } from '../art/kenney'
import type { WaterEdges } from '../art/scenery'
import { kindAt, positionInHouse, type Tile, type TileMap } from './tileMap'

/** How a map tile is drawn. Numbers are frames in Kenney's Tiny Town sheet (src/art/kenney.ts). */
export type GroundTile =
  /** A whole Kenney tile: grass, flowers, the stone path, or part of a house. */
  | { kind: 'ground'; frame: number }
  /** Something small on grass: a tree, bush or mushrooms (Kenney), or our rock. */
  | { kind: 'decor'; under: number; decor: number | 'rock' }
  /** A tall tree: the trunk on this tile, the crown on the tile above, drawn in depth order with the character. */
  | { kind: 'tallTree'; under: number; trunk: number; crown: number }
  /** Our water, with the land around it, so banks and corners line up. */
  | { kind: 'water'; edges: WaterEdges; variant: number }

/** A fixed pseudo-random number per tile, so the map looks varied but the same every time. */
function tileNoise({ col, row }: Tile): number {
  const n = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453
  return n - Math.floor(n)
}

/**
 * Decides how each tile is drawn (docs/ART_DIRECTION.md). Grass gets the odd tuft,
 * trees vary between kinds, houses are put together from their parts, and water
 * knows which sides meet land. Stations stand on plain grass; their signs are drawn separately.
 */
export function groundTile(map: TileMap, tile: Tile): GroundTile {
  const noise = tileNoise(tile)
  const { grass } = tinyTownTiles
  const kind = kindAt(map, tile)
  switch (kind) {
    case 'flowers':
      return { kind: 'ground', frame: tinyTownTiles.grassFlowers }
    case 'path':
      return { kind: 'ground', frame: tinyTownTiles.stonePath }
    case 'mushrooms':
      return { kind: 'decor', under: grass, decor: tinyTownTiles.mushrooms }
    case 'tree':
      return { kind: 'decor', under: grass, decor: noise < 0.75 ? tinyTownTiles.tree : tinyTownTiles.roundTree }
    case 'bush':
      return { kind: 'decor', under: grass, decor: tinyTownTiles.roundTree }
    case 'rock':
      return { kind: 'decor', under: grass, decor: 'rock' }
    case 'tallTree': {
      const autumn = noise < 0.3
      return {
        kind: 'tallTree',
        under: grass,
        trunk: autumn ? tinyTownTiles.autumnTreeTrunk : tinyTownTiles.tallTreeTrunk,
        crown: autumn ? tinyTownTiles.autumnTreeTop : tinyTownTiles.tallTreeTop,
      }
    }
    case 'blueHouse':
    case 'redHouse': {
      const { dc, dr } = positionInHouse(map, tile, kind)
      return { kind: 'ground', frame: tinyTownHouses[kind][dr]?.[dc] ?? grass }
    }
    case 'townHouseBlue':
    case 'townHouseRed': {
      const { dc, dr } = positionInHouse(map, tile, kind)
      return { kind: 'ground', frame: tinyTownHouses[kind === 'townHouseBlue' ? 'blueHouse' : 'redHouse'][dr]?.[dc] ?? grass }
    }
    case 'water': {
      const land = (dc: number, dr: number) => kindAt(map, { col: tile.col + dc, row: tile.row + dr }) !== 'water'
      return {
        kind: 'water',
        edges: {
          up: land(0, -1),
          down: land(0, 1),
          left: land(-1, 0),
          right: land(1, 0),
          upLeft: land(-1, -1),
          upRight: land(1, -1),
          downLeft: land(-1, 1),
          downRight: land(1, 1),
        },
        variant: (tile.col + tile.row) % 2,
      }
    }
    default:
      return { kind: 'ground', frame: noise < 0.18 ? tinyTownTiles.grassTufts : grass }
  }
}

/** A short name for a water tile's shape, so each distinct shape becomes one texture. */
export function waterKey(edges: WaterEdges, variant: number): string {
  const sides = Object.entries(edges)
    .filter(([, land]) => land)
    .map(([side]) => side)
    .join('-')
  return `water-${sides || 'open'}-${variant}`
}
