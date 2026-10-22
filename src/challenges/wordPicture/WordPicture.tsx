import { useState } from 'react'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { challengeDifficulties } from '../difficulty'
import { wordPictureVoice } from '../voices'
import { createWordPictureRound } from './createRound'

/** Ord och bild: hear "Var är solen?" and tap the picture. */
export function WordPicture({ seed, difficulty, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() => createWordPictureRound({ seed, words }))

  return (
    <ChoiceChallenge
      round={round}
      voice={wordPictureVoice}
      difficulty={difficulty}
      difficultyCount={challengeDifficulties.wordPicture.length}
      onRoundComplete={onRoundComplete}
      choiceKind="picture"
      renderChoice={(id) => <Picture emoji={getWord(id).picture} />}
      choiceLabel={(id) => getWord(id).base}
      // Without a voice, show the word so an adult can read it out.
      silentPrompt={(q) => getWord(q.target).base}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
