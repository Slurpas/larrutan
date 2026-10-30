import { describe, expect, it } from 'vitest'
import { TILE, cameraZoom, tapSlop } from './camera'
import { hubMap } from './hubMap'
import { places } from './places'

const mapWidth = hubMap.cols * TILE
const mapHeight = hubMap.rows * TILE

describe('cameraZoom', () => {
  it('shows tiles at 64 px on iPads held sideways', () => {
    expect(cameraZoom(1180, 820, mapWidth, mapHeight) * TILE).toBe(64)
    expect(cameraZoom(1024, 768, mapWidth, mapHeight) * TILE).toBe(64)
  })

  it('draws the world at half size on iPads held sideways, so the child looks small in it', () => {
    const { map, tilePx } = places.world
    expect(cameraZoom(1180, 820, map.cols * TILE, map.rows * TILE, tilePx) * TILE).toBe(32)
    expect(cameraZoom(1024, 768, map.cols * TILE, map.rows * TILE, tilePx) * TILE).toBe(32)
  })

  it('zooms out on iPads held upright so all signs still fit across', () => {
    for (const [width, height] of [
      [810, 1080],
      [768, 1024],
    ] as const) {
      const tilesAcross = width / (cameraZoom(width, height, mapWidth, mapHeight) * TILE)
      expect(tilesAcross, `${width}×${height}`).toBeGreaterThanOrEqual(15.5)
    }
  })

  it('uses a whole-number zoom in landscape, so every pixel of the art is the same size', () => {
    for (const [width, height] of [
      [1180, 820],
      [1080, 810],
      [1366, 1024],
      [1440, 900],
      [1920, 1080],
      [2560, 1440],
      [844, 390],
    ] as const) {
      expect(Number.isInteger(cameraZoom(width, height, mapWidth, mapHeight)), `${width}×${height}`).toBe(true)
    }
  })

  it('never shows more than the map, so there is no empty space at the edges', () => {
    const viewports = [
      [375, 812],
      [820, 1180],
      [1180, 820],
      [1366, 1024],
      [1920, 1080],
      [2560, 1440],
      [3840, 2160],
    ] as const
    for (const [width, height] of viewports) {
      const zoom = cameraZoom(width, height, mapWidth, mapHeight)
      expect(width / zoom, `${width}×${height}`).toBeLessThanOrEqual(mapWidth + 1e-9)
      expect(height / zoom, `${width}×${height}`).toBeLessThanOrEqual(mapHeight + 1e-9)
    }
  })
})

describe('tapSlop', () => {
  it('lets a finger hit a rock on a phone, and gives a little on an iPad', () => {
    // An iPhone in landscape: 32 px tiles, so a rock's tile with the slop around it is 56 px across.
    expect((1 + 2 * tapSlop(2)) * 2 * TILE).toBe(56)
    expect(tapSlop(4)).toBe(2 / TILE)
    expect(tapSlop(1)).toBe(6 / TILE)
  })
})
