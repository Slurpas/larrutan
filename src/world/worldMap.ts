import { parseMap, type StationDef } from './tileMap'

/**
 * The world (the user's idea, 2026-10-27): the child, small in a big world (drawn at half the
 * towns' zoom, src/world/places.ts), walks to a town and goes in, to its map of games. Same
 * characters as the towns' maps (src/world/hubMap.ts), plus:
 *   Q  a town house, blue roof    K  a town house, red roof   (3×3 each; tapping one walks to its town's sign)
 *   l  the town of letters' sign  n  the town of maths' sign  (2×2 each)
 * Both signs show from the start on the smallest iPad.
 */
const grid = [
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  'T.TT.TT.TT.TT.TT.TT.TT.TT.TT.TT.TT.TT.TT',
  'T......................................T',
  'TT.....................................T',
  'T......T........B...........T......B..TT',
  'T..Y....................Y..............T',
  'TT.........Y....................Y......T',
  'T..................,.,................TT',
  'T....,,.......R...........m.......,,...T',
  'TT.....................................T',
  'T................Y....Y...............TT',
  'T.......KKK..................QQQ.......T',
  'TT..QQQ.KKK.QQQ....,,....KKK.QQQ.KKK...T',
  'T...QQQ.KKK.QQQ......,...KKK.QQQ.KKK..TT',
  'T...QQQ.....QQQ..........KKK.....KKK...T',
  'TT...............m.....B...............T',
  'T.......ll....................nn......TT',
  'T..B....ll....................nn....B..T',
  'TT......============@===========.......T',
  'T...................=.................TT',
  'T...................=..................T',
  'TT...Y.....,,.......=............B.....T',
  'T...................=.....,,..........TT',
  'T.......T...........=................Y.T',
  'TTT.............~~~~~~~................T',
  'T..............~~~~~~~~~.....Y........TT',
  'T...........Y..~~~~~~~~~...........T...T',
  'TT..R..........~~~~~~~~~...............T',
  'T................~~~~~................TT',
  'T......m.................,.....R.......T',
  'TT............,........................T',
  'T.........Y.................Y.........TT',
  'T.T...T...T...T...T...T...T...T...T...TT',
  'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
]

const towns: StationDef[] = [
  { key: 'l', town: 'letters' },
  { key: 'n', town: 'maths' },
]

export const worldMap = parseMap(grid, towns)
