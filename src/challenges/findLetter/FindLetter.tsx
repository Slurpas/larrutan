import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import type { ChallengeScreenProps } from '../challengeProps'
import { Bubbles } from '../bubbles/Bubbles'
import { challengeDifficulties } from '../difficulty'
import { findAllVoice } from '../voices'
import { createFindLetterRound } from './createRound'

/** Hitta bokstaven, as Bubblor: hear "Hitta alla A!" and pop every bubble with an A. */
export function FindLetter({ seed, difficulty, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() =>
    createFindLetterRound({ seed, letters, confusables: confusableLetters, difficulty, practiceBox }),
  )

  return (
    <Bubbles
      round={round}
      voice={findAllVoice}
      difficulty={difficulty}
      difficultyCount={challengeDifficulties.findLetter.length}
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
