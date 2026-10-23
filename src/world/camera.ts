/** World units per tile. Matches the planned 16×16 pixel-art tiles. */
export const TILE = 16

/** On-screen size of a tile in CSS pixels, before zooming in to cover the screen. */
const TARGET_TILE_PX = 64
/** Narrow (portrait) screens zoom out until this many tiles fit across, so all signs show. */
const MIN_TILES_ACROSS = 16

/**
 * Camera zoom for a viewport: tiles are about 64 px (smaller on narrow screens),
 * but the visible area is never larger than the map, which would show empty space.
 * Pixel art needs a whole-number zoom, or its pixels come out unevenly sized; only
 * narrow screens (an upright iPad, which is asked to turn) fall back to an exact zoom.
 */
export function cameraZoom(viewportWidth: number, viewportHeight: number, mapWidth: number, mapHeight: number): number {
  const preferred = Math.min(TARGET_TILE_PX / TILE, viewportWidth / (MIN_TILES_ACROSS * TILE))
  const toCover = Math.max(viewportWidth / mapWidth, viewportHeight / mapHeight)
  const whole = Math.max(1, Math.floor(preferred), Math.ceil(toCover - 1e-9))
  const showsEnoughTiles = whole <= preferred || viewportWidth / (whole * TILE) >= MIN_TILES_ACROSS
  return showsEnoughTiles ? whole : Math.max(preferred, toCover)
}
