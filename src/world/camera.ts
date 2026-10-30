/** World units per tile. Matches the planned 16×16 pixel-art tiles. */
export const TILE = 16

/** On-screen size of a town's tiles in CSS pixels, before zooming in to cover the screen. The world map uses 32: the child looks small in a big world. */
export const TOWN_TILE_PX = 64
/** Narrow (portrait) screens zoom out until this many town tiles fit across, so all signs show (twice as many at half the size). */
const MIN_TILES_ACROSS = 16

/**
 * Camera zoom for a viewport: tiles are about `tilePx` (smaller on narrow screens),
 * but the visible area is never larger than the map, which would show empty space.
 * Pixel art needs a whole-number zoom, or its pixels come out unevenly sized; only
 * narrow screens (an upright iPad, which is asked to turn) fall back to an exact zoom.
 */
export function cameraZoom(viewportWidth: number, viewportHeight: number, mapWidth: number, mapHeight: number, tilePx = TOWN_TILE_PX): number {
  const minTilesAcross = (MIN_TILES_ACROSS * TOWN_TILE_PX) / tilePx
  const preferred = Math.min(tilePx / TILE, viewportWidth / (minTilesAcross * TILE))
  const toCover = Math.max(viewportWidth / mapWidth, viewportHeight / mapHeight)
  const whole = Math.max(1, Math.floor(preferred), Math.ceil(toCover - 1e-9))
  const showsEnoughTiles = whole <= preferred || viewportWidth / (whole * TILE) >= minTilesAcross
  return showsEnoughTiles ? whole : Math.max(preferred, toCover)
}

/**
 * How far beside a small thing on the map (a rock, a tree) a tap still counts, in tiles: on a
 * phone, where a tile is about 32 px, enough for a finger (a target about 56 px across); on an
 * iPad a little. The user couldn't hit the rocks and single trees on their iPhone (2026-10-30).
 */
export function tapSlop(zoom: number): number {
  return Math.min(6, Math.max(2, (56 / zoom - TILE) / 2)) / TILE
}
