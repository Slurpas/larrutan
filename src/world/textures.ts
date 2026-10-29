import type Phaser from 'phaser'
import { composeCharacter, outfitKey, type CharacterFacing, type Outfit } from '../art/outfit'
import { palette } from '../art/palette'
import { Pixels } from '../art/pixels'
import { bubble, drop, ripple, rock, waterTile, type WaterEdges } from '../art/scenery'
import { apple, cards, fruitBasket, mouse, mowerIcon, piles, stationSign, sun } from '../art/signs'
import { waterKey } from './groundTiles'

/** The Kenney sheet, loaded as 16×16 frames (see src/art/kenney.ts). */
export const tinyTownKey = 'tiny-town'

export const signKey = (highlighted: boolean) => (highlighted ? 'sign-highlighted' : 'sign')
export const iconKeys = { sun: 'icon-sun', apple: 'icon-apple', mouse: 'icon-mouse', cards: 'icon-cards', piles: 'icon-piles', fruitBasket: 'icon-fruit-basket', mower: 'icon-mower' } as const
export const rockKey = 'rock'
export const shadowKey = 'shadow'
/** Falling into the water (src/world/splash.ts). */
export const splashKeys = { ripple: 'splash-ripple', drop: 'splash-drop', bubble: 'splash-bubble' } as const

/** Draws a text-grid sprite (src/art) into a Phaser texture, once per key. */
function addGridTexture(scene: Phaser.Scene, key: string, grid: readonly string[]): string {
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
      context.fillRect(x, y, 1, 1)
    }),
  )
  texture.refresh()
  return key
}

/** Our own sprites as textures: signs, pictures, rock, shadow and splash. */
export function addArtTextures(scene: Phaser.Scene): void {
  addGridTexture(scene, signKey(false), stationSign(false))
  addGridTexture(scene, signKey(true), stationSign(true))
  addGridTexture(scene, iconKeys.sun, sun)
  addGridTexture(scene, iconKeys.apple, apple)
  addGridTexture(scene, iconKeys.mouse, mouse)
  addGridTexture(scene, iconKeys.cards, cards)
  addGridTexture(scene, iconKeys.piles, piles)
  addGridTexture(scene, iconKeys.fruitBasket, fruitBasket)
  addGridTexture(scene, iconKeys.mower, mowerIcon)
  addGridTexture(scene, rockKey, rock)
  addGridTexture(scene, shadowKey, new Pixels(12, 4).ellipse(6, 2, 6, 2, 'o').toGrid())
  addGridTexture(scene, splashKeys.ripple, ripple)
  addGridTexture(scene, splashKeys.drop, drop)
  addGridTexture(scene, splashKeys.bubble, bubble)
}

/** The character's textures for one outfit (src/art/outfit.ts), made the first time it is worn. */
export function characterTextures(scene: Phaser.Scene, outfit: Outfit): (facing: CharacterFacing, frame: number) => string {
  const name = outfitKey(outfit)
  const key = (facing: CharacterFacing, frame: number) => `player-${name}-${facing}-${frame}`
  for (const facing of ['down', 'up', 'side', 'left'] as const)
    for (let frame = 0; frame < 4; frame++) addGridTexture(scene, key(facing, frame), composeCharacter(facing, frame, outfit))
  return key
}

/** A water tile's texture, made the first time that shape is needed. */
export function waterTexture(scene: Phaser.Scene, edges: WaterEdges, variant: number): string {
  return addGridTexture(scene, waterKey(edges, variant), waterTile(edges, variant))
}
