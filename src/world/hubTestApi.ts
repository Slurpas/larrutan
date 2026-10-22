import type { ChallengeId } from '../challenges/challengeIds'
import type { Tile } from './tileMap'

/** Lets browser tests find stations and the player. Only present in dev builds (see hubGame.ts). */
export interface HubTestApi {
  playerTile(): Tile
  isMoving(): boolean
  /** The hat (emoji) the character on the map is wearing, if any. */
  hat(): string | null
  /** Where a station's sign is on screen, in CSS pixels from the top-left of the page. */
  stationPoint(challenge: ChallengeId): { x: number; y: number } | null
}

declare global {
  interface Window {
    __larrutanHub?: HubTestApi
  }
}
