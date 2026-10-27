import type { ChallengeId } from '../challenges/challengeIds'
import { TOWN_TILE_PX } from './camera'
import { hubMap } from './hubMap'
import { mathsTownMap } from './mathsTownMap'
import type { Tile, TileMap, TownId } from './tileMap'
import { worldMap } from './worldMap'

/**
 * Where the child can be: the world, or one of its towns, each a map to walk around (the
 * user's idea, 2026-10-27). The game starts in the world; going into a town opens its map,
 * and the top-left button goes back out.
 */
export type PlaceId = 'world' | TownId

export interface Place {
  map: TileMap
  /** How big a tile is on screen (src/world/camera.ts): the world is drawn at half size, so the child looks small in it. */
  tilePx: number
}

export const places: Record<PlaceId, Place> = {
  world: { map: worldMap, tilePx: TOWN_TILE_PX / 2 },
  letters: { map: hubMap, tilePx: TOWN_TILE_PX },
  maths: { map: mathsTownMap, tilePx: TOWN_TILE_PX },
}

/** Which town each challenge's sign stands in. */
export const townOf: Record<ChallengeId, TownId> = {
  findLetter: 'letters',
  firstLetter: 'letters',
  wordPicture: 'letters',
  spelling: 'letters',
  memory: 'letters',
  sorting: 'letters',
  baskets: 'letters',
  fruit: 'maths',
}

/** Where the child stands on arriving: back in the world, outside the town just left; anywhere else, at the map's start. */
export function arrivalTile(place: PlaceId, from: PlaceId | null): Tile {
  const { map } = places[place]
  const sign = place === 'world' ? map.stations.find((station) => 'town' in station && station.town === from) : undefined
  return sign ? { col: sign.origin.col, row: sign.origin.row + 2 } : map.start
}

/** A ?place=letters in the address starts there instead of in the world (for testing, like ?seed). */
export function readPlaceFromUrl(search: string): PlaceId | null {
  const value = new URLSearchParams(search).get('place')
  return value !== null && value in places ? (value as PlaceId) : null
}
