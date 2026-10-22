import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { challengeDifficulties } from '../difficulty'
import { findLetterVoice } from '../voices'
import { createFindLetterRound } from './createRound'

/** Hitta bokstaven: hear "Var är A?" and tap the letter. */
export function FindLetter({ seed, difficulty, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() =>
    createFindLetterRound({ seed, letters, confusables: confusableLetters, difficulty }),
  )

  return (
    <ChoiceChallenge
      round={round}
      voice={findLetterVoice}
      difficulty={difficulty}
      difficultyCount={challengeDifficulties.findLetter.length}
      onRoundComplete={onRoundComplete}
      choiceKind="letter"
      renderChoice={(id) => getLetter(id).display}
      choiceLabel={(id) => getLetter(id).display}
      // Without a voice the question can't be heard, so show which letter to find.
      silentPrompt={(q) => getLetter(q.target).display}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
