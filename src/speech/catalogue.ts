import { findLetterVoice, firstLetterVoice, wordPictureVoice } from '../challenges/voices'
import { letters } from '../content/letters'
import { phrases } from '../content/phrases'
import { words } from '../content/words'
import { items } from '../rewards/items'

/** Played by the "Test the voice" button in the ?debug=voices panel. */
export const voiceTestPhrase = phrases.hubWelcome

/**
 * Every sentence the game can say. `npm run speech` turns each into an audio
 * file; a test checks that real rounds never say anything missing from here.
 */
export function spokenTexts(): string[] {
  const texts = new Set<string>([
    phrases.hubWelcome,
    ...phrases.praise,
    phrases.hardLevelIntro,
    phrases.levelUp,
    phrases.myThingsHelp,
  ])

  for (const item of items) {
    texts.add(phrases.itemUnlocked(item.indefinite))
    texts.add(item.hint)
  }

  for (const voice of [findLetterVoice, firstLetterVoice, wordPictureVoice]) texts.add(voice.complete)

  for (const letter of letters) {
    const question = { target: letter.id, choices: [letter.id] }
    texts.add(findLetterVoice.ask(question))
    texts.add(findLetterVoice.reveal(question))
    texts.add(findLetterVoice.nameChoice(letter.id))
    texts.add(firstLetterVoice.nameChoice(letter.id))
  }

  for (const word of words) {
    const firstLetterQuestion = { word: word.id, target: word.firstLetter, choices: [word.firstLetter] }
    texts.add(firstLetterVoice.ask(firstLetterQuestion))
    if (firstLetterVoice.askAgain) texts.add(firstLetterVoice.askAgain(firstLetterQuestion))
    texts.add(firstLetterVoice.reveal(firstLetterQuestion))

    const pictureQuestion = { target: word.id, choices: [word.id] }
    texts.add(wordPictureVoice.ask(pictureQuestion))
    texts.add(wordPictureVoice.reveal(pictureQuestion))
    texts.add(wordPictureVoice.nameChoice(word.id))
  }

  return [...texts]
}
