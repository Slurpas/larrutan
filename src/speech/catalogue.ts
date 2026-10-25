import { dragonVoice, firstLetterVoice, wordPictureVoice } from '../challenges/voices'
import { letters } from '../content/letters'
import { phrases } from '../content/phrases'
import { words } from '../content/words'
import { lettersOf, spelledLengths, spellingWords } from '../challenges/spelling/createRound'
import { stationLevels } from '../challenges/levels'
import { items } from '../rewards/items'

/** Played by the "Test the voice" button in the ?debug=voices panel. */
export const voiceTestPhrase = phrases.hubWelcome

/** Sentences that belong together, for the review page: the map and rewards, then each letter and each word. */
export interface SpokenGroup {
  title: string
  /** The word's id, if the group is a word: the review page shows its picture. */
  word?: string
  texts: string[]
}

export function spokenGroups(): SpokenGroup[] {
  const groups: SpokenGroup[] = [
    {
      title: 'Map, rewards and Mina saker',
      texts: [
        phrases.hubWelcome,
        // What each new level is (said once, when the child gets there).
        ...Object.values(stationLevels).flatMap((levels) => levels.flatMap((level) => ('intro' in level ? [level.intro] : []))),
        phrases.readWordQuestion,
        phrases.memoryIntro,
        phrases.memoryShort,
        phrases.nextTimeHarder,
        phrases.levelUp,
        phrases.myThingsHelp,
        phrases.tapToWear,
        ...items.flatMap((item) => [phrases.itemUnlocked(item.indefinite), item.hint]),
      ],
    },
  ]

  for (const letter of letters) {
    const question = { target: letter.id, choices: [letter.id] }
    groups.push({
      title: `Letter ${letter.id}`,
      texts: [
        dragonVoice.ask(question),
        dragonVoice.reveal(question),
        dragonVoice.nameChoice(letter.id),
        firstLetterVoice.nameChoice(letter.id),
        phrases.letterShort(letter.spoken),
      ],
    })
  }

  // Bygg ordet names every letter it pops, also those no challenge teaches yet (the K in "raket").
  groups.push({
    title: 'Letters in Bygg ordet',
    texts: [...new Set(spellingWords(words, spelledLengths).flatMap(lettersOf))]
      .sort((a, b) => a.localeCompare(b, 'sv'))
      .map((letter) => phrases.letterShort(letter)),
  })

  const spelled = new Set(spellingWords(words, spelledLengths).map((word) => word.id))
  for (const word of words) {
    const firstLetterQuestion = { word: word.id, target: word.firstLetter, choices: [word.firstLetter] }
    const pictureQuestion = { target: word.id, choices: [word.id] }
    groups.push({
      title: `Word: ${word.base}`,
      word: word.id,
      texts: [
        firstLetterVoice.ask(firstLetterQuestion),
        ...(firstLetterVoice.askAgain ? [firstLetterVoice.askAgain(firstLetterQuestion)] : []),
        firstLetterVoice.reveal(firstLetterQuestion),
        wordPictureVoice.ask(pictureQuestion),
        wordPictureVoice.reveal(pictureQuestion),
        wordPictureVoice.nameChoice(word.id),
        ...(spelled.has(word.id) ? [phrases.spellingQuestion(word.base)] : []),
      ],
    })
  }

  // A sentence shared by two groups (e.g. "Det där är A." in both letter challenges) is listed once.
  const seen = new Set<string>()
  return groups.map((group) => ({ ...group, texts: group.texts.filter((text) => !seen.has(text) && seen.add(text)) }))
}

/**
 * Every sentence the game can say. `npm run speech` turns each into an audio
 * file; a test checks that real rounds never say anything missing from here.
 */
export function spokenTexts(): string[] {
  return spokenGroups().flatMap((group) => group.texts)
}
