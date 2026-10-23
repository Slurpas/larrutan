/**
 * A tiny pixel canvas for sprites drawn from simple shapes (signs, pictures, rocks,
 * water). It produces the same text grids as the hand-drawn sprites, one palette
 * character per pixel and "." for transparent, so every sprite is reproducible.
 */
export class Pixels {
  private readonly cells: string[][]

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = Array.from({ length: height }, () => Array<string>(width).fill('.'))
  }

  get(x: number, y: number): string {
    return this.cells[Math.floor(y)]?.[Math.floor(x)] ?? '.'
  }

  set(x: number, y: number, color: string): this {
    const row = this.cells[Math.floor(y)]
    if (row && x >= 0 && x < this.width) row[Math.floor(x)] = color
    return this
  }

  rect(x: number, y: number, width: number, height: number, color: string): this {
    for (let j = y; j < y + height; j++) for (let i = x; i < x + width; i++) this.set(i, j, color)
    return this
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): this {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++)
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + 0.5 - cx) / rx
        const dy = (y + 0.5 - cy) / ry
        if (dx * dx + dy * dy <= 1) this.set(x, y, color)
      }
    return this
  }

  /** Recolours the pixels of one colour where `where` holds (e.g. a shadow on one side). */
  shade(from: string, to: string, where: (x: number, y: number) => boolean): this {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) if (this.get(x, y) === from && where(x, y)) this.set(x, y, to)
    return this
  }

  /** A 1-pixel outline around everything drawn so far. */
  outline(color: string): this {
    const filled = (x: number, y: number) => this.get(x, y) !== '.'
    const around: [number, number][] = []
    for (let y = 0; y < this.height; y++)
      for (let x = 0; x < this.width; x++)
        if (!filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))) around.push([x, y])
    for (const [x, y] of around) this.set(x, y, color)
    return this
  }

  /** Copies another grid on top, at (x, y); its transparent pixels are skipped. */
  draw(grid: readonly string[], x: number, y: number): this {
    grid.forEach((row, j) => [...row].forEach((color, i) => color !== '.' && this.set(x + i, y + j, color)))
    return this
  }

  toGrid(): string[] {
    return this.cells.map((row) => row.join(''))
  }
}
