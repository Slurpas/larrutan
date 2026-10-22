import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { firstLetterVoice } from '../voices'
import { createFirstLetterRound } from './createRound'

interface FirstLetterProps {
  seed: number
  onExit: () => void
  onPlayAgain: () => void
}

/** Första bokstaven: see a picture, hear "Vilken bokstav börjar sol på?", tap the letter. */
export function FirstLetter({ seed, onExit, onPlayAgain }: FirstLetterProps) {
  const [round] = useState(() =>
    createFirstLetterRound({ seed, words, letters, confusables: confusableLetters }),
  )

  return (
    <ChoiceChallenge
      round={round}
      voice={firstLetterVoice}
      choiceKind="letter"
      renderChoice={(id) => getLetter(id).display}
      choiceLabel={(id) => getLetter(id).display}
      showcase={(q) => <Picture emoji={getWord(q.word).picture} />}
      // Without a voice, show the word so an adult can read it out.
      silentPrompt={(q) => getWord(q.word).base}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
