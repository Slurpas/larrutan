import { useState } from 'react'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { levelIntro, levelParams } from '../levels'
import { spellingWords } from '../spelling/createRound'
import { readWordVoice, wordPictureVoice } from '../voices'
import { createWordPictureRound } from './createRound'

/**
 * Ord och bild: hear "Var är solen?" and tap the picture. Higher levels also show the word,
 * and at the top the child reads it without hearing it ("Läs ordet!"), so only short words
 * are asked about there (the ones Bygg ordet spells).
 */
export function WordPicture({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const { choices, word } = levelParams('wordPicture', level)
  const [round] = useState(() =>
    createWordPictureRound({
      seed,
      words,
      choiceCount: choices,
      targets: word === 'written' ? spellingWords(words) : words,
      practiceBox,
    }),
  )
  const written = word !== 'said'

  return (
    <ChoiceChallenge
      round={round}
      voice={word === 'written' ? readWordVoice : wordPictureVoice}
      level={level}
      levelIntro={announceLevel ? levelIntro('wordPicture', level) : undefined}
      onRoundComplete={onRoundComplete}
      practiceItem={(q) => q.target}
      knowsChallenge={knowsChallenge}
      choiceKind="picture"
      renderChoice={(id) => <Picture word={id} />}
      choiceLabel={(id) => getWord(id).base}
      // Capitals, like every letter the game teaches.
      showcase={written ? (q) => getWord(q.target).base.toLocaleUpperCase('sv') : undefined}
      showcaseKind="word"
      // Without a voice, show the word so an adult can read it out (unless it is shown anyway).
      silentPrompt={written ? undefined : (q) => getWord(q.target).base}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
