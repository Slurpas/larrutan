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
  /** Mata draken: the dragon wants a letter cookie ("ett A": letters are neuter). */
  dragonQuestion: (letter: string) => `Draken vill ha ett ${letter}!`,

  firstLetterQuestion: (word: string) => `Vilken bokstav börjar ${word} på?`,
  /** Once the child knows the game, just the word ("Öra."). */
  firstLetterShort: (word: string) => `${word.charAt(0).toLocaleUpperCase('sv')}${word.slice(1)}.`,
  firstLetterReveal: (word: string, letter: string) => `${word} börjar på ${letter}!`,

  wordPictureQuestion: (definite: string) => `Var är ${definite}?`,

  /** Bygg ordet: build this word from the bubbles. */
  spellingQuestion: (word: string) => `Bygg ordet ${word}!`,

  /** Memory: the first time, then the short form once the child knows the game. */
  memoryIntro: 'Vänd på två kort. Hitta en bild och en bokstav som hör ihop!',
  memoryShort: 'Hitta paren!',
  /** A turned letter card: just the letter ("A."). */
  letterShort: (letter: string) => `${letter}.`,

  /** Before the first question of a hard round, saying what is harder (Task 15). */
  lookAlikesIntro: 'Nu blir det svårare! Några bokstäver är nästan lika. Titta noga!',
  fourTunnelsIntro: 'Nu blir det svårare! Nu finns det fyra tunnlar.',
  hiddenWordIntro: 'Nu blir det svårare! Nu syns inte ordet.',
  moreCardsIntro: 'Nu blir det svårare! Fler kort, och några bokstäver är nästan lika.',
  /** At the end of a round after which the station opens at the hard level. */
  nextTimeHarder: 'Nästa gång blir det svårare.',
  levelUp: 'Du har gått upp en nivå!',
  itemUnlocked: (indefinite: string) => `Du fick ${indefinite}!`,
  /** After a new item, until the child has worn something: the item on the reward screen is a button. */
  tapToWear: 'Tryck på den för att ta på den!',
  myThingsHelp: 'Här är dina saker. Tryck på en sak för att ta på den.',
} as const
