import { parseMap, type StationDef } from './tileMap'

/**
 * The hub area, one character per tile:
 *   .  grass       ,  flowers     m  mushrooms   =  path      @  start (on a path)
 *   T  tree        Y  tall tree   B  bush        R  rock      ~  water
 *   H  blue house  h  red house  (3×3 each)
 *   a  Hitta bokstaven   b  Första bokstaven   c  Ord och bild   d  Bygg ordet   e  Memory
 *   f  Sortera korten    g  Bokstavskorgarna   (2×2 each)
 * Only grass, flowers, mushrooms and paths can be walked on; the border is all trees.
 * A tall tree's crown hangs over the tile above it, which stays walkable.
 * All the signs sit close to the start so they are on screen straight away
 * on an iPad; the houses and the rest of the map are there to explore.
 */
const grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TT.HHH.,.Y....TT...Y..hhh.B.TT',
  'T.BHHH,....R..TT.m....hhh.,,.T',
  'T..HHH..,.............hhh..R.T',
  'T.Y.=....Y...,.........=.Y.T.T',
  'T.,,=..Y.....,..,,...Y.=...m.T',
  'T...,........,...........,.B.T',
  'T.Y....aa..gg..ff..bb.....B..T',
  'T.R....aa..gg..ff..bb.....,..T',
  'T..m..,,=...=..=...=..Y......T',
  'T.......=...=..=...=....,,...T',
  'T..T....======@=====.....T...T',
  'T.Y......=,,..=...B=.........T',
  'T.....,.dd.m..=....ee..YR....T',
  'T.......dd....cc...ee......B.T',
  'T...R.........cc.....~~~~....T',
  'T.,,..Y.....,....,..~~~~~~.m.T',
  'T..,.......T....Y....~~~~..B.T',
  'T.m.....,,..............,....T',
  'TT.....R...........T........TT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

const stations: StationDef[] = [
  { key: 'a', challenge: 'findLetter' },
  { key: 'b', challenge: 'firstLetter' },
  { key: 'c', challenge: 'wordPicture' },
  { key: 'd', challenge: 'spelling' },
  { key: 'e', challenge: 'memory' },
  { key: 'f', challenge: 'sorting' },
  { key: 'g', challenge: 'baskets' },
]

export const hubMap = parseMap(grid, stations)
