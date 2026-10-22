import { parseMap, type StationDef } from './tileMap'

/**
 * The hub area, one character per tile:
 *   .  grass       ,  flowers     =  path       @  start (on a path)
 *   T  tree        R  rock        ~  water
 *   a  Hitta bokstaven   b  Första bokstaven   c  Ord och bild  (2×2 each)
 * Trees, rocks, water and stations block movement; the border is all trees.
 * All three signs sit close to the start so they are on screen straight away
 * on an iPad; the rest of the map is there to explore.
 */
const grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'TT....,.......TT.......,....TT',
  'T...R.........TT..........,..T',
  'T.......,..................R.T',
  'T..T.......................T.T',
  'T.............,..............T',
  'T...,....................,...T',
  'T.......aa.........bb........T',
  'T.R.....aa.........bb.....,..T',
  'T........=.........=.........T',
  'T........=.........=.........T',
  'T..T.....=====@=====.....T...T',
  'T.............=..............T',
  'T.....,.......=.........R....T',
  'T.............cc.............T',
  'T...R.........cc.....~~~~....T',
  'T...................~~~~~~...T',
  'T..,.......T.........~~~~....T',
  'T.......................,....T',
  'TT.....R...........T........TT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

const stations: StationDef[] = [
  { key: 'a', challenge: 'findLetter' },
  { key: 'b', challenge: 'firstLetter' },
  { key: 'c', challenge: 'wordPicture' },
]

export const hubMap = parseMap(grid, stations)
