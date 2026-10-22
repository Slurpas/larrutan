export type ChallengeId = 'findLetter' | 'firstLetter' | 'wordPicture'

/** Names for adults, tests and accessibility; children see pictures. */
export const challengeNames: Record<ChallengeId, string> = {
  findLetter: 'Hitta bokstaven',
  firstLetter: 'Första bokstaven',
  wordPicture: 'Ord och bild',
}
