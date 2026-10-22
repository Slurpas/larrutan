import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { phrases } from '../../content/phrases'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { createFindLetterRound } from './createRound'

interface FindLetterProps {
  seed: number
  onExit: () => void
  onPlayAgain: () => void
}

/** Hitta bokstaven: hear "Var är A?" and tap the letter. */
export function FindLetter({ seed, onExit, onPlayAgain }: FindLetterProps) {
  const [round] = useState(() => createFindLetterRound({ seed, letters, confusables: confusableLetters }))
  const spoken = (id: string) => getLetter(id).spoken

  return (
    <ChoiceChallenge
      round={round}
      ask={(q) => phrases.findLetterQuestion(spoken(q.target))}
      reveal={(q) => phrases.hereIs(spoken(q.target))}
      nameChoice={(id) => phrases.thatIs(spoken(id))}
      complete={phrases.findLetterComplete}
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
