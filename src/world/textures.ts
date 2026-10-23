import type Phaser from 'phaser'
import { characterFrames, type Facing } from '../art/character'
import { palette } from '../art/palette'
import { Pixels } from '../art/pixels'
import { rock, waterTile, type WaterEdges } from '../art/scenery'
import { apple, mouse, stationSign, sun } from '../art/signs'
import { waterKey } from './groundTiles'

/** The Kenney sheet, loaded as 16×16 frames (see src/art/kenney.ts). */
export const tinyTownKey = 'tiny-town'

/** The character faces down, up, right (`side`) or left (the right-hand frames mirrored). */
export type CharacterFacing = Facing | 'left'

export const characterFrameKey = (facing: CharacterFacing, frame: number) => `player-${facing}-${frame}`
export const signKey = (highlighted: boolean) => (highlighted ? 'sign-highlighted' : 'sign')
export const iconKeys = { sun: 'icon-sun', apple: 'icon-apple', mouse: 'icon-mouse' } as const
export const rockKey = 'rock'
export const shadowKey = 'shadow'

/** Draws a text-grid sprite (src/art) into a Phaser texture, once per key. */
function addGridTexture(scene: Phaser.Scene, key: string, grid: readonly string[], mirror = false): string {
  if (scene.textures.exists(key)) return key
  const width = grid[0]?.length ?? 0
  const texture = scene.textures.createCanvas(key, width, grid.length)
  const context = texture?.getContext()
  if (!texture || !context) throw new Error(`Could not create texture "${key}"`)
  grid.forEach((row, y) =>
    [...row].forEach((color, x) => {
      const fill = palette[color]
      if (!fill) return
      context.fillStyle = fill
      context.fillRect(mirror ? width - 1 - x : x, y, 1, 1)
    }),
  )
  texture.refresh()
  return key
}

/** Our own sprites as textures: the character, signs, pictures, rock and shadow. */
export function addArtTextures(scene: Phaser.Scene): void {
  for (const facing of ['down', 'up', 'side'] as const) {
    characterFrames[facing].forEach((grid, frame) => {
      addGridTexture(scene, characterFrameKey(facing, frame), grid)
      if (facing === 'side') addGridTexture(scene, characterFrameKey('left', frame), grid, true)
    })
  }
  addGridTexture(scene, signKey(false), stationSign(false))
  addGridTexture(scene, signKey(true), stationSign(true))
  addGridTexture(scene, iconKeys.sun, sun)
  addGridTexture(scene, iconKeys.apple, apple)
  addGridTexture(scene, iconKeys.mouse, mouse)
  addGridTexture(scene, rockKey, rock)
  addGridTexture(scene, shadowKey, new Pixels(12, 4).ellipse(6, 2, 6, 2, 'o').toGrid())
}

/** A water tile's texture, made the first time that shape is needed. */
export function waterTexture(scene: Phaser.Scene, edges: WaterEdges, variant: number): string {
  return addGridTexture(scene, waterKey(edges, variant), waterTile(edges, variant))
}
