import tinyTownUrl from './kenney/tiny-town.png?url'

/**
 * Tiles from Kenney's "Tiny Town" (CC0, kenney.nl; licence in ./kenney/). The sheet is
 * 12 tiles across, 16×16 each, packed without spacing; tiles are referred to by index
 * (row × 12 + column). Each tile includes its grass background.
 */
export const tinyTown = {
  url: tinyTownUrl,
  columns: 12,
  tileSize: 16,
} as const

export const tinyTownTiles = {
  grass: 0,
  grassTufts: 1,
  grassFlowers: 2,
  stonePath: 43,
  tree: 28,
  roundTree: 5,
  mushrooms: 29,
  tallTreeTop: 4,
  tallTreeTrunk: 16,
  autumnTreeTop: 3,
  autumnTreeTrunk: 15,
} as const

export type TinyTownTile = keyof typeof tinyTownTiles

/** The two 3×3 houses, row by row: roof, roof with a gable, then the wall with a door and windows. */
export const tinyTownHouses = {
  blueHouse: [
    [48, 49, 50],
    [60, 63, 62],
    [84, 85, 84],
  ],
  redHouse: [
    [52, 53, 54],
    [64, 67, 66],
    [72, 86, 75],
  ],
} as const
