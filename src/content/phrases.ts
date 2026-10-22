/** Everything the game says out loud, in one place so wording and pronunciation can be fixed here. */
export const phrases = {
  hubWelcome: 'Tryck på en skylt för att spela!',
  praise: ['Rätt!', 'Bra!', 'Snyggt!', 'Ja, precis!', 'Toppen!'],
  /** Names a wrong choice the child tapped: "Det där är S." / "Det där är en mus." */
  thatIs: (what: string) => `Det där är ${what}.`,
  /** Points at the answer once it is the only choice left: "Här är A!" / "Här är solen!" */
  hereIs: (what: string) => `Här är ${what}!`,

  findLetterQuestion: (letter: string) => `Var är ${letter}?`,
  findLetterComplete: 'Bra jobbat! Du hittade alla bokstäverna!',

  firstLetterQuestion: (word: string) => `Vilken bokstav börjar ${word} på?`,
  firstLetterReveal: (word: string, letter: string) => `${word} börjar på ${letter}!`,
  firstLetterComplete: 'Bra jobbat! Du hittade alla första bokstäverna!',

  wordPictureQuestion: (definite: string) => `Var är ${definite}?`,
  wordPictureComplete: 'Bra jobbat! Du hittade alla bilderna!',
} as const
