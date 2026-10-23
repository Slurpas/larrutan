import { palette } from '../art/palette'

/** A text-grid sprite as rectangles: each run of one colour in a row becomes one rectangle. */
export function pixelRuns(grid: readonly string[]): { x: number; y: number; w: number; fill: string }[] {
  const runs: { x: number; y: number; w: number; fill: string }[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const color = row[x] ?? '.'
      let end = x + 1
      while (row[end] === color) end++
      const fill = palette[color]
      if (fill) runs.push({ x, y, w: end - x, fill })
      x = end
    }
  })
  return runs
}

/** A sprite as a CSS `url(…)`, for tiles that repeat as a background (track, floor, rock). */
export function pixelBackground(grid: readonly string[]): string {
  const width = grid[0]?.length ?? 0
  const rects = pixelRuns(grid)
    .map(({ x, y, w, fill }) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${fill}"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${grid.length}" shape-rendering="crispEdges">${rects}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
