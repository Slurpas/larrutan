import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { findLetterVoice } from '../voices'
import { createFindLetterRound } from './createRound'

interface FindLetterProps {
  seed: number
  onExit: () => void
  onPlayAgain: () => void
}

/** Hitta bokstaven: hear "Var är A?" and tap the letter. */
export function FindLetter({ seed, onExit, onPlayAgain }: FindLetterProps) {
  const [round] = useState(() => createFindLetterRound({ seed, letters, confusables: confusableLetters }))

  return (
    <ChoiceChallenge
      round={round}
      voice={findLetterVoice}
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
