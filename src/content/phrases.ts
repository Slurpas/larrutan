/**
 * Everything the game says out loud, in one place so wording and pronunciation
 * can be fixed here. Praise and celebrations are sound effects, not words.
 */
export const phrases = {
  hubWelcome: 'Tryck på en skylt för att spela!',
  /** Names a wrong choice the child tapped: "Det där är S." / "Det där är en mus." */
  thatIs: (what: string) => `Det där är ${what}.`,
  /** Points at the answer once it is the only choice left: "Här är A!" / "Här är solen!" */
  hereIs: (what: string) => `Här är ${what}!`,

  findLetterQuestion: (letter: string) => `Var är ${letter}?`,

  firstLetterQuestion: (word: string) => `Vilken bokstav börjar ${word} på?`,
  /** Once the child knows the game, just the word ("Öra."). */
  firstLetterShort: (word: string) => `${word.charAt(0).toLocaleUpperCase('sv')}${word.slice(1)}.`,
  firstLetterReveal: (word: string, letter: string) => `${word} börjar på ${letter}!`,

  wordPictureQuestion: (definite: string) => `Var är ${definite}?`,

  /** Before the first question of a hard round. */
  hardLevelIntro: 'Nu blir det svårare. Titta noga!',
  levelUp: 'Du har gått upp en nivå!',
  itemUnlocked: (indefinite: string) => `Du fick ${indefinite}!`,
  myThingsHelp: 'Här är dina saker. Tryck på en sak för att ta på den.',
} as const
