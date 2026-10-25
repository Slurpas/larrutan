import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import type { ChallengeScreenProps } from '../challengeProps'
import { Dragon } from '../dragon/Dragon'
import { lookAlikeRule } from '../difficulty'
import { levelIntro, levelParams } from '../levels'
import { dragonVoice } from '../voices'
import { createFindLetterRound } from './createRound'

/** Hitta bokstaven, as Mata draken: hear "Draken vill ha ett A!" and feed the dragon the A cookie. */
export function FindLetter({ seed, level, announceLevel, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() => {
    const { choices, lookAlikes, questions } = levelParams('findLetter', level)
    return createFindLetterRound({
      seed,
      letters,
      confusables: confusableLetters,
      difficulty: lookAlikeRule(lookAlikes),
      choiceCount: choices,
      questionCount: questions,
      practiceBox,
    })
  })

  return (
    <Dragon
      round={round}
      voice={dragonVoice}
      level={level}
      levelIntro={announceLevel ? levelIntro('findLetter', level) : undefined}
      onRoundComplete={onRoundComplete}
      practiceItem={(q) => q.target}
      knowsChallenge={knowsChallenge}
      renderChoice={(id) => getLetter(id).display}
      choiceLabel={(id) => getLetter(id).display}
      // Without a voice the question can't be heard, so show which letter to find.
      silentPrompt={(q) => getLetter(q.target).display}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
