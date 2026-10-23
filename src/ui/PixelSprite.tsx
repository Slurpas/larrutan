import type { CSSProperties } from 'react'
import { pixelRuns } from './pixelImage'

interface PixelSpriteProps {
  /** A text-grid sprite from src/art: one palette character per pixel, "." for transparent. */
  grid: readonly string[]
  className?: string
  style?: CSSProperties
}

/**
 * Draws a pixel-art sprite as crisp SVG, at any size, for the parts of the game
 * outside the map (e.g. the character in "Mina saker"). Runs of one colour
 * become one rectangle each.
 */
export function PixelSprite({ grid, className, style }: PixelSpriteProps) {
  const width = grid[0]?.length ?? 0
  return (
    <svg className={className} style={style} viewBox={`0 0 ${width} ${grid.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {pixelRuns(grid).map(({ x, y, w, fill }) => (
        <rect key={`${x},${y}`} x={x} y={y} width={w} height={1} fill={fill} />
      ))}
    </svg>
  )
}
