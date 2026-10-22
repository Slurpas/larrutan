import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { ChoiceQuestion, ChoiceRound } from '../challenges/choiceQuestion'
import { createFindLetterRound } from '../challenges/findLetter/createRound'
import { createFirstLetterRound } from '../challenges/firstLetter/createRound'
import {
  findLetterVoice,
  firstLetterVoice,
  wordPictureVoice,
  type ChallengeVoice,
} from '../challenges/voices'
import { createWordPictureRound } from '../challenges/wordPicture/createRound'
import { confusableLetters, letters } from '../content/letters'
import { words } from '../content/words'
import { spokenTexts } from './catalogue'
import { clipFileName } from './clipName'

const catalogue = new Set(spokenTexts())
const seeds = Array.from({ length: 300 }, (_, i) => i * 104729 + 3)

/** Everything a round can make the challenge say, including every wrong choice the child might tap. */
function everythingSaid<Q extends ChoiceQuestion>(round: ChoiceRound<Q>, voice: ChallengeVoice<Q>): string[] {
  return round.questions.flatMap((q) => [voice.ask(q), voice.reveal(q), ...q.choices.map(voice.nameChoice)])
}

describe('speech catalogue', () => {
  it('contains everything Hitta bokstaven can say', () => {
    for (const seed of seeds) {
      const round = createFindLetterRound({ seed, letters, confusables: confusableLetters })
      for (const text of everythingSaid(round, findLetterVoice)) expect(catalogue).toContain(text)
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

  it('gives every sentence its own file name', () => {
    const names = [...catalogue].map(clipFileName)
    expect(new Set(names).size).toBe(names.length)
    expect(clipFileName('Var är Å?')).toMatch(/^var-ar-a-[0-9a-f]{8}\.mp3$/)
    expect(clipFileName('Var är Å?')).not.toBe(clipFileName('Var är A?'))
  })

  it('has a generated audio file for every sentence (run `npm run speech` after changing content)', () => {
    const missing = [...catalogue].filter(
      (text) => !existsSync(fileURLToPath(new URL(`./audio/sv/${clipFileName(text)}`, import.meta.url))),
    )
    expect(missing).toEqual([])
  })
})
