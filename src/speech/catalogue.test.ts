import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { ChoiceQuestion, ChoiceRound } from '../challenges/choiceQuestion'
import { createFindLetterRound } from '../challenges/findLetter/createRound'
import { createFirstLetterRound } from '../challenges/firstLetter/createRound'
import { findAllVoice, firstLetterVoice, wordPictureVoice, type ChallengeVoice } from '../challenges/voices'
import { createWordPictureRound } from '../challenges/wordPicture/createRound'
import { confusableLetters, letters } from '../content/letters'
import { phrases } from '../content/phrases'
import { words } from '../content/words'
import { items } from '../rewards/items'
import { spokenTexts } from './catalogue'
import { clipFileName } from './clipName'
import { retakes } from './retakes'
import type { SoundId } from './speech'
import { speechVoice } from './voiceSettings'

const catalogue = new Set(spokenTexts())
const seeds = Array.from({ length: 300 }, (_, i) => i * 104729 + 3)

/** Everything a round can make the challenge say, including every wrong choice the child might tap. */
function everythingSaid<Q extends ChoiceQuestion>(round: ChoiceRound<Q>, voice: ChallengeVoice<Q>): string[] {
  return round.questions.flatMap((q) => [
    voice.ask(q),
    ...(voice.askAgain ? [voice.askAgain(q)] : []),
    voice.reveal(q),
    ...q.choices.map(voice.nameChoice),
  ])
}

describe('speech catalogue', () => {
  it('contains everything Hitta bokstaven (Bubblor) can say', () => {
    for (const seed of seeds) {
      const round = createFindLetterRound({ seed, letters, confusables: confusableLetters })
      for (const text of everythingSaid(round, findAllVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains everything Första bokstaven can say', () => {
    for (const seed of seeds) {
      const round = createFirstLetterRound({ seed, words, letters, confusables: confusableLetters })
      for (const text of everythingSaid(round, firstLetterVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains everything Ord och bild can say', () => {
    for (const seed of seeds) {
      const round = createWordPictureRound({ seed, words })
      for (const text of everythingSaid(round, wordPictureVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains everything said about rewards', () => {
    for (const text of [phrases.hardLevelIntro, phrases.levelUp, phrases.myThingsHelp]) expect(catalogue).toContain(text)
    for (const item of items) {
      expect(catalogue).toContain(phrases.itemUnlocked(item.indefinite))
      expect(catalogue).toContain(item.hint)
    }
  })

  it('contains everything the hard levels can say', () => {
    for (const seed of seeds.slice(0, 100)) {
      const findLetter = createFindLetterRound({ seed, letters, confusables: confusableLetters, difficulty: 'hard' })
      for (const text of everythingSaid(findLetter, findAllVoice)) expect(catalogue).toContain(text)
      const firstLetter = createFirstLetterRound({
        seed,
        words,
        letters,
        confusables: confusableLetters,
        difficulty: 'hard',
      })
      for (const text of everythingSaid(firstLetter, firstLetterVoice)) expect(catalogue).toContain(text)
    }
  })

  it('gives every sentence its own file name', () => {
    const names = [...catalogue].map((text) => clipFileName(text))
    expect(new Set(names).size).toBe(names.length)
    expect(clipFileName('Var är Å?')).toMatch(/^var-ar-a-[0-9a-f]{8}\.mp3$/)
    expect(clipFileName('Var är Å?')).not.toBe(clipFileName('Var är A?'))
  })

  it('renames a clip when the voice changes, so old audio and old approvals never carry over', () => {
    const slower = { ...speechVoice, lengthScale: speechVoice.lengthScale + 0.1 }
    expect(clipFileName('Var är Å?', slower)).not.toBe(clipFileName('Var är Å?'))
  })

  it('only retakes sentences the game says, from take 2 on', () => {
    for (const [text, take] of Object.entries(retakes)) {
      expect(catalogue, text).toContain(text)
      expect(Number.isInteger(take) && take >= 2, `${text}: take ${take}`).toBe(true)
    }
  })

  it('has a sound file for every sound effect (run `npm run sfx` to make them)', () => {
    for (const sound of ['correct', 'fanfare', 'levelUp', 'newItem', 'pop'] satisfies SoundId[]) {
      expect(existsSync(fileURLToPath(new URL(`../sound/sfx/${sound}.mp3`, import.meta.url))), sound).toBe(true)
    }
  })

  it('has a generated audio file for every sentence (run `npm run speech` after changing content)', () => {
    const missing = [...catalogue].filter(
      (text) => !existsSync(fileURLToPath(new URL(`./audio/sv/${clipFileName(text)}`, import.meta.url))),
    )
    expect(missing).toEqual([])
  })
})
