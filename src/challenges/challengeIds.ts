export type ChallengeId = 'findLetter' | 'firstLetter' | 'wordPicture' | 'spelling' | 'memory'

/** Names for adults, tests and accessibility; children see pictures. */
export const challengeNames: Record<ChallengeId, string> = {
  findLetter: 'Hitta bokstaven',
  firstLetter: 'Första bokstaven',
  wordPicture: 'Ord och bild',
  spelling: 'Bygg ordet',
  memory: 'Memory',
}
