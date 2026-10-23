import { palette } from '../art/palette'

interface PixelSpriteProps {
  /** A text-grid sprite from src/art: one palette character per pixel, "." for transparent. */
  grid: readonly string[]
  className?: string
}

/**
 * Draws a pixel-art sprite as crisp SVG, at any size, for the parts of the game
 * outside the map (e.g. the character in "Mina saker"). Runs of one colour
 * become one rectangle each.
 */
export function PixelSprite({ grid, className }: PixelSpriteProps) {
  const width = grid[0]?.length ?? 0
  const rects: { x: number; y: number; w: number; fill: string }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = row[x] ?? '.'
      let end = x + 1
      while (row[end] === color) end++
      const fill = palette[color]
      if (fill) rects.push({ x, y, w: end - x, fill })
      x = end
    }
  })
  return (
    <svg className={className} viewBox={`0 0 ${width} ${grid.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rects.map(({ x, y, w, fill }) => (
        <rect key={`${x},${y}`} x={x} y={y} width={w} height={1} fill={fill} />
      ))}
    </svg>
  )
}
