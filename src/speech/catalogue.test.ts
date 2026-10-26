import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { challengeNames, type ChallengeId } from '../challenges/challengeIds'
import type { ChoiceQuestion, ChoiceRound } from '../challenges/choiceQuestion'
import { lookAlikeRule } from '../challenges/difficulty'
import { createFindLetterRound } from '../challenges/findLetter/createRound'
import { createFirstLetterRound } from '../challenges/firstLetter/createRound'
import { levelIntro, levelParams, type Level } from '../challenges/levels'
import { dragonVoice, firstLetterVoice, readWordVoice, wordPictureVoice, type ChallengeVoice } from '../challenges/voices'
import { createWordPictureRound } from '../challenges/wordPicture/createRound'
import { createSpellingRound, spellingWords } from '../challenges/spelling/createRound'
import { createMemoryRound } from '../challenges/memory/createRound'
import { createSortingRound } from '../challenges/sorting/createRound'
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
const levels = [1, 2, 3, 4] as const satisfies readonly Level[]
/** Every level of a station, a different one for each seed. */
const levelFor = (seed: number): Level => levels[seed % levels.length]!

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
  it('contains everything Hitta bokstaven (Mata draken) can say, at every level', () => {
    for (const seed of seeds) {
      const { choices, lookAlikes, questions } = levelParams('findLetter', levelFor(seed))
      const round = createFindLetterRound({
        seed,
        letters,
        confusables: confusableLetters,
        difficulty: lookAlikeRule(lookAlikes),
        choiceCount: choices,
        questionCount: questions,
      })
      for (const text of everythingSaid(round, dragonVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains everything Första bokstaven can say, at every level', () => {
    for (const seed of seeds) {
      const { choices, lookAlikes, questions } = levelParams('firstLetter', levelFor(seed))
      const round = createFirstLetterRound({
        seed,
        words,
        letters,
        confusables: confusableLetters,
        difficulty: lookAlikeRule(lookAlikes),
        choiceCount: choices,
        questionCount: questions,
      })
      for (const text of everythingSaid(round, firstLetterVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains everything Ord och bild can say, at every level', () => {
    for (const seed of seeds) {
      const { choices, word } = levelParams('wordPicture', levelFor(seed))
      const targets = word === 'written' ? spellingWords(words) : words
      const round = createWordPictureRound({ seed, words, choiceCount: choices, targets })
      for (const text of everythingSaid(round, word === 'written' ? readWordVoice : wordPictureVoice)) expect(catalogue).toContain(text)
    }
  })

  it('contains what every level says when the child first gets there', () => {
    for (const challenge of Object.keys(challengeNames) as ChallengeId[])
      for (const level of levels) {
        const intro = levelIntro(challenge, level)
        if (intro) expect(catalogue, `${challenge} ${level}`).toContain(intro)
      }
  })

  it('contains everything said about rewards', () => {
    for (const text of [phrases.levelUp, phrases.myThingsHelp, phrases.nextTimeHarder]) expect(catalogue).toContain(text)
    for (const item of items) {
      expect(catalogue).toContain(phrases.itemUnlocked(item.indefinite))
      expect(catalogue).toContain(item.hint)
    }
  })

  it('contains everything Bygg ordet can say, at every level', () => {
    for (const seed of seeds) {
      const { lookAlike, extraLetters, lengths } = levelParams('spelling', levelFor(seed))
      const round = createSpellingRound({ seed, words, difficulty: lookAlikeRule(lookAlike), extras: extraLetters, lengths })
      for (const question of round.questions) {
        const word = words.find((w) => w.id === question.word)!
        expect(catalogue).toContain(phrases.spellingQuestion(word.base))
        expect(catalogue).toContain(phrases.firstLetterShort(word.base))
        // Every bubble, right or wrong, is named when it is popped.
        for (const bubble of question.bubbles) expect(catalogue).toContain(phrases.letterShort(bubble.letter))
      }
    }
  })

  it('contains everything Memory can say, at every level', () => {
    for (const seed of seeds) {
      const { pairs, lookAlikes } = levelParams('memory', levelFor(seed))
      const board = createMemoryRound({ seed, words, letters, confusables: confusableLetters, difficulty: lookAlikeRule(lookAlikes), pairs })
      for (const card of board.cards) {
        const word = words.find((w) => w.id === card.pair)!
        const letter = letters.find((l) => l.id === card.letter)!
        expect(catalogue).toContain(card.kind === 'letter' ? phrases.letterShort(letter.spoken) : phrases.firstLetterShort(word.base))
        expect(catalogue).toContain(phrases.firstLetterReveal(word.base, letter.spoken))
      }
    }
    for (const text of [phrases.memoryIntro, phrases.memoryShort]) expect(catalogue).toContain(text)
  })

  it('contains everything Sortera korten can say, at every level', () => {
    for (const seed of seeds) {
      const { sets, cardsPerSet, lookAlikes } = levelParams('sorting', levelFor(seed))
      const round = createSortingRound({ seed, words, letters, confusables: confusableLetters, sets, cardsPerSet, difficulty: lookAlikeRule(lookAlikes) })
      // Every card is named when it is picked up, and when another card is refused on it.
      for (const card of Object.values(round.cards)) {
        const letter = letters.find((l) => l.id === card.set)!
        expect(catalogue).toContain(card.kind === 'letter' ? phrases.letterShort(letter.spoken) : phrases.firstLetterShort(words.find((w) => w.id === card.word)!.base))
        expect(catalogue).toContain(phrases.letterShort(letter.spoken))
      }
    }
    for (const text of [phrases.sortingIntro, phrases.sortingShort]) expect(catalogue).toContain(text)
  })

  it('gives every sentence its own file name', () => {
    const names = [...catalogue].map((text) => clipFileName(text))
    expect(new Set(names).size).toBe(names.length)
    expect(clipFileName('Var är Å?')).toMatch(/^var-ar-a-[0-9a-f]{8}\.mp3$/)
    expect(clipFileName('Var är Å?')).not.toBe(clipFileName('Var är A?'))
  })

  it('renames a clip when the voice changes, so old audio and old approvals never carry over', () => {
    const longerPause = { ...speechVoice, pauseSeconds: speechVoice.pauseSeconds + 0.1 }
    expect(clipFileName('Var är Å?', longerPause)).not.toBe(clipFileName('Var är Å?'))
    const charlotte = {
      engine: 'ElevenLabs',
      voice: 'Charlotte',
      voiceId: 'some-voice-id',
      model: 'eleven_multilingual_v2',
      speed: 0.85,
      stability: 0.5,
      similarity: 0.75,
      pauseSeconds: 0.4,
    } as const
    expect(clipFileName('Var är Å?', charlotte)).not.toBe(clipFileName('Var är Å?'))
    expect(clipFileName('Var är Å?', charlotte)).toMatch(/^var-ar-a-[0-9a-f]{8}\.mp3$/)
  })

  it('only retakes sentences the game says, from take 2 on', () => {
    for (const [text, take] of Object.entries(retakes)) {
      expect(catalogue, text).toContain(text)
      expect(Number.isInteger(take) && take >= 2, `${text}: take ${take}`).toBe(true)
    }
  })

  it('has a sound file for every sound effect (run `npm run sfx` to make them)', () => {
    for (const sound of ['correct', 'fanfare', 'levelUp', 'newItem', 'pop', 'knock'] satisfies SoundId[]) {
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
