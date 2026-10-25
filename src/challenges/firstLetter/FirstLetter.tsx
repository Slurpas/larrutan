import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import type { ChallengeScreenProps } from '../challengeProps'
import { lookAlikeRule } from '../difficulty'
import { levelIntro, levelParams } from '../levels'
import { MineCart } from '../mineCart/MineCart'
import { firstLetterVoice } from '../voices'
import { createFirstLetterRound } from './createRound'

/** Första bokstaven, as Gruvvagnen: see a picture, hear "Vilken bokstav börjar sol på?", ride into the tunnel with that letter. */
export function FirstLetter({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() => {
    const { choices, lookAlikes, questions } = levelParams('firstLetter', level)
    return createFirstLetterRound({
      seed,
      words,
      letters,
      confusables: confusableLetters,
      difficulty: lookAlikeRule(lookAlikes),
      choiceCount: choices,
      questionCount: questions,
      practiceBox,
    })
  })

  return (
    <MineCart
      round={round}
      voice={firstLetterVoice}
      level={level}
      levelIntro={announceLevel ? levelIntro('firstLetter', level) : undefined}
      onRoundComplete={onRoundComplete}
      practiceItem={(q) => q.word}
      knowsChallenge={knowsChallenge}
      choiceKind="letter"
      renderChoice={(id) => getLetter(id).display}
      choiceLabel={(id) => getLetter(id).display}
      showcase={(q) => <Picture word={q.word} />}
      // Without a voice, show the word so an adult can read it out.
      silentPrompt={(q) => getWord(q.word).base}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
