import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import type { HouseKind, Tile } from './tileMap'

/** Lets browser tests find stations and the player. Only present in dev builds (see hubGame.ts). */
export interface HubTestApi {
  playerTile(): Tile
  /** Where the character's body is on screen, in CSS pixels from the top-left of the page. */
  playerPoint(): { x: number; y: number } | null
  isMoving(): boolean
  /** What the character on the map is wearing, by slot. */
  outfit(): Outfit
  /** Where a station's sign is on screen, in CSS pixels from the top-left of the page. */
  stationPoint(challenge: ChallengeId): { x: number; y: number } | null
  /** Where the middle of a map tile is on screen, in CSS pixels from the top-left of the page. */
  tilePoint(tile: Tile): { x: number; y: number } | null
  /** Where a house's door is on screen, in CSS pixels from the top-left of the page. */
  housePoint(kind: HouseKind): { x: number; y: number } | null
  /** How many times the child has knocked at the red house. */
  knocks(): number
}

declare global {
  interface Window {
    __larrutanHub?: HubTestApi
  }
}
