import { characterFeetRow, characterFrames, characterHeadTop, type Facing } from './character'
import { Pixels } from './pixels'
import { clothingMask, wardrobe, type ArtFacing, type PlacedSprite, type Slot } from './wardrobe'

/** What the character wears: at most one item per slot (src/rewards/items.ts). */
export type Outfit = Readonly<Partial<Record<Slot, string>>>

/** Down, up, right (`side`), or left: the right-hand art mirrored. */
export type CharacterFacing = Facing | 'left'

/** Room around the 16×32 character for tall hats, wings and balloons. */
const margin = { x: 5, y: 8 }
export const outfitSize = { width: 16 + margin.x * 2, height: 32 + margin.y } as const
/** Rows of the composed sprite, counted like characterFeetRow and characterHeadTop. */
export const outfitFeetRow = characterFeetRow + margin.y
export const outfitHeadTop = characterHeadTop + margin.y

/** Back items go nearest the body, then hats, then what is held. */
const slotOrder: readonly Slot[] = ['back', 'head', 'held']

/**
 * The one character renderer (PRD §9): the character in one walk frame, facing one
 * way, wearing an outfit. Used on the map, in "Mina saker" and on the reward screen.
 */
export function composeCharacter(facing: CharacterFacing, frame: number, outfit: Outfit): string[] {
  const art: ArtFacing = facing === 'left' ? 'side' : facing
  const frames = characterFrames[art]
  const body = dress(frames[frame % frames.length] ?? [], outfit)

  const placed: { slot: Slot; sprite: PlacedSprite }[] = []
  for (const slot of slotOrder) {
    const item = outfit[slot] ? wardrobe[outfit[slot]] : undefined
    if (item?.kind === 'sprite') placed.push({ slot, sprite: item[art] ?? item.down })
  }

  const canvas = new Pixels(outfitSize.width, outfitSize.height)
  const draw = ({ grid, x, y }: PlacedSprite) => canvas.draw(grid, x + margin.x, y + margin.y)
  placed.filter(({ sprite }) => sprite.behind).forEach(({ sprite }) => draw(sprite))
  canvas.draw(body, margin.x, margin.y)
  placed.filter(({ sprite }) => !sprite.behind).forEach(({ sprite }) => draw(sprite))

  const grid = canvas.toGrid()
  return facing === 'left' ? grid.map((row) => [...row].reverse().join('')) : grid
}

/** Repaints the shirt and trousers for the worn top and bottoms (mask-based, so every frame fits). */
function dress(frame: readonly string[], outfit: Outfit): readonly string[] {
  const garments = (['top', 'bottoms'] as const).flatMap((slot) => {
    const item = outfit[slot] ? wardrobe[outfit[slot]] : undefined
    const mask = clothingMask[slot]
    if (item?.kind !== 'recolor' || !mask) return []
    // Stripes are counted from the top of the garment, so they line up in every frame.
    const top = frame.findIndex((row) => [...row].some((c) => mask.includes(c)))
    return [{ item, mask, top }]
  })
  // Each pixel is judged by the bare body, so a sweater's new colour is never repainted as trousers.
  return frame.map((row, y) =>
    [...row]
      .map((c, x) => {
        const garment = garments.find(({ mask }) => mask.includes(c))
        if (!garment) return c
        const { item, top } = garment
        if (item.dots && (x + y * 2) % item.dots.every === 0) return item.dots.color
        return item.rows[(y - top) % item.rows.length]?.[c] ?? c
      })
      .join(''),
  )
}

/** A stable name for an outfit, e.g. for texture keys: "back=cape|head=cap". */
export function outfitKey(outfit: Outfit): string {
  return (
    Object.entries(outfit)
      .filter(([, id]) => id)
      .map(([slot, id]) => `${slot}=${id}`)
      .sort()
      .join('|') || 'plain'
  )
}
