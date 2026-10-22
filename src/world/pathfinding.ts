import { directions, isWalkable, sameTile, type Tile, type TileMap } from './tileMap'

/**
 * Shortest walkable path from start to the nearest of the goals (breadth-first;
 * the map is small). The path excludes the start and ends on a goal.
 * Returns [] if already on a goal and null if no goal can be reached.
 */
export function findPath(map: TileMap, start: Tile, goals: readonly Tile[]): Tile[] | null {
  if (goals.some((goal) => sameTile(goal, start))) return []

  const key = (t: Tile) => t.row * map.cols + t.col
  const cameFrom = new Map<number, Tile | null>([[key(start), null]])
  const queue: Tile[] = [start]

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i]!
    for (const delta of Object.values(directions)) {
      const next = { col: current.col + delta.col, row: current.row + delta.row }
      if (cameFrom.has(key(next)) || !isWalkable(map, next)) continue
      cameFrom.set(key(next), current)
      if (goals.some((goal) => sameTile(goal, next))) return walkBack(cameFrom, next, key)
      queue.push(next)
    }
  }
  return null
}

function walkBack(cameFrom: Map<number, Tile | null>, end: Tile, key: (t: Tile) => number): Tile[] {
  const path: Tile[] = []
  for (let tile: Tile | null | undefined = end; tile; tile = cameFrom.get(key(tile))) path.unshift(tile)
  return path.slice(1)
}

/**
 * The walkable tile closest to where the child tapped, so a tap on a tree or
 * the pond still walks somewhere sensible instead of doing nothing.
 */
export function nearestWalkable(map: TileMap, target: Tile): Tile | null {
  let best: Tile | null = null
  let bestDistance = Infinity
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      const tile = { col, row }
      if (!isWalkable(map, tile)) continue
      const distance = (col - target.col) ** 2 + (row - target.row) ** 2
      if (distance < bestDistance) {
        best = tile
        bestDistance = distance
      }
    }
  }
  return best
}
