import type { Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import type { Tile } from './tileMap'

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
}

declare global {
  interface Window {
    __larrutanHub?: HubTestApi
  }
}
