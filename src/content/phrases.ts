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
  /** Sortera korten: the first time, and after that. */
  sortingIntro: 'Lägg en bokstav och bilderna som börjar på den i samma hög!',
  sortingShort: 'Sortera korten!',
  basketsIntro: 'Lägg varje bild i korgen med bokstaven som den börjar på!',
  basketsShort: 'Lägg bilderna i rätt korg!',
  /** Räkna frukterna: the question the first time and from the speaker, and the short form after that. */
  fruitQuestion: 'Räkna frukterna! Hur många är det?',
  fruitShort: 'Hur många?',
  /** A number on its own ("Sju."): a tapped number, or counting. */
  numberShort: (word: string) => `${word.charAt(0).toLocaleUpperCase('sv')}${word.slice(1)}.`,
  /** A turned letter card: just the letter ("A."). */
  letterShort: (letter: string) => `${letter}.`,

  /** Said once, before the first round at a new level, saying what is harder (src/challenges/levels.ts). */
  lookAlikesIntro: 'Nu blir det svårare! Några bokstäver är nästan lika. Titta noga!',
  moreCookiesIntro: 'Nu blir det fler kex!',
  evenMoreCookiesIntro: 'Nu blir det ännu fler kex!',
  fourTunnelsIntro: 'Nu blir det svårare! Nu finns det fyra tunnlar.',
  longerRideIntro: 'Nu blir resan längre!',
  fourPicturesIntro: 'Nu blir det fyra bilder!',
  writtenWordIntro: 'Titta, nu står ordet skrivet!',
  readYourselfIntro: 'Nu ska du läsa ordet själv!',
  wordFadesIntro: 'Titta noga! Snart försvinner ordet.',
  someLettersIntro: 'Nu syns bara några bokstäver!',
  hiddenWordIntro: 'Nu blir det svårare! Nu syns inte ordet.',
  moreCardsIntro: 'Nu blir det fler kort!',
  lookAlikeCardsIntro: 'Nu blir det svårare! Fler kort, och några bokstäver är nästan lika.',
  evenMoreCardsIntro: 'Nu blir det ännu fler kort!',
  /** Räkna frukterna's levels: the sum under the fruit shows less and less. */
  countYourselfIntro: 'Nu räknar du själv!',
  oneNumberIntro: 'Nu syns bara en siffra!',
  noNumbersIntro: 'Nu syns inga siffror!',
  /** Ord och bild when the child reads the word: the word is only written. */
  readWordQuestion: 'Läs ordet!',
  /** At the end of a round after which the station opens a level higher. */
  nextTimeHarder: 'Nästa gång blir det svårare.',
  levelUp: 'Du har gått upp en nivå!',
  itemUnlocked: (indefinite: string) => `Du fick ${indefinite}!`,
  /** After a new item, until the child has worn something: the item on the reward screen is a button. */
  tapToWear: 'Tryck på den för att ta på den!',
  myThingsHelp: 'Här är dina saker. Tryck på en sak för att ta på den.',
} as const
