/** Everything the game says out loud, in one place so wording and pronunciation can be fixed here. */
export const phrases = {
  findLetterQuestion: (letter: string) => `Var är ${letter}?`,
  /** Names the wrong letter the child tapped. */
  thatIs: (letter: string) => `Det där är ${letter}.`,
  /** Points at the answer once it is the only choice left. */
  hereIs: (letter: string) => `Här är ${letter}!`,
  praise: ['Rätt!', 'Bra!', 'Snyggt!', 'Ja, precis!', 'Toppen!'],
  findLetterComplete: 'Bra jobbat! Du hittade alla bokstäverna!',
} as const
