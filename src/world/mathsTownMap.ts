import { parseMap, type StationDef } from './tileMap'

/**
 * The town of maths (the user's idea, 2026-10-27): its own map of games, drawn like the town
 * of letters (src/world/hubMap.ts, same characters). Its signs stand in the same places as
 * there, so they show from the start on the smallest iPad. Its two red houses can be knocked on.
 *   r  Räkna frukterna   (2×2)
 */
const grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T...hhh...T....T....T.hhhT...T',
  'T...hhh...............hhh....T',
  'T...hhh...............hhh....T',
  'T....=.................=.....T',
  'T..........,,....m...........T',
  'T.........................Y..T',
  'T.Y.....rr...........,.......T',
  'T.......rr...................T',
  'T........=.........=.....R...T',
  'T..B.....=.........=.........T',
  'T........=====@=====.........T',
  'T........=....=....=.........T',
  'T.....,,......=.........B....T',
  'T...~~.......................T',
  'T..~~~~.....R................T',
  'T..~~~~...............Y......T',
  'T..~~~~...T.....,,...........T',
  'T.T.....,.................m..T',
  'T............................T',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

const stations: StationDef[] = [{ key: 'r', challenge: 'fruit' }]

export const mathsTownMap = parseMap(grid, stations)
