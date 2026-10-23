import { useState } from 'react'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import type { ChallengeScreenProps } from '../challengeProps'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { challengeDifficulties } from '../difficulty'
import { wordPictureVoice } from '../voices'
import { createWordPictureRound } from './createRound'

/** Ord och bild: hear "Var är solen?" and tap the picture. */
export function WordPicture({ seed, difficulty, knowsChallenge, practiceBox, onRoundComplete, onExit, onPlayAgain }: ChallengeScreenProps) {
  const [round] = useState(() => createWordPictureRound({ seed, words, practiceBox }))

  return (
    <ChoiceChallenge
      round={round}
      voice={wordPictureVoice}
      difficulty={difficulty}
      difficultyCount={challengeDifficulties.wordPicture.length}
      onRoundComplete={onRoundComplete}
      practiceItem={(q) => q.target}
      knowsChallenge={knowsChallenge}
      choiceKind="picture"
      renderChoice={(id) => <Picture word={id} />}
      choiceLabel={(id) => getWord(id).base}
      // Without a voice, show the word so an adult can read it out.
      silentPrompt={(q) => getWord(q.target).base}
      onExit={onExit}
      onPlayAgain={onPlayAgain}
    />
  )
}
