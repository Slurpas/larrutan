import { useState } from 'react'
import { confusableLetters, getLetter, letters } from '../../content/letters'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { challengeDifficulties } from '../difficulty'
import { firstLetterVoice } from '../voices'
import { createFirstLetterRound } from './createRound'

/** Första bokstaven: see a picture, hear "Vilken bokstav börjar sol på?", tap the letter. */
export function FirstLetter({ seed, difficulty, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() =>
    createFirstLetterRound({ seed, words, letters, confusables: confusableLetters, difficulty }),
  )

  return (
    <ChoiceChallenge
      round={round}
      voice={firstLetterVoice}
      difficulty={difficulty}
      difficultyCount={challengeDifficulties.firstLetter.length}
      onRoundComplete={onRoundComplete}
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
