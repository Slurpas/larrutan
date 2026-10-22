import { useState } from 'react'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import { ChoiceChallenge } from '../ChoiceChallenge'
import { wordPictureVoice } from '../voices'
import { createWordPictureRound } from './createRound'

interface WordPictureProps {
  seed: number
  onExit: () => void
  onPlayAgain: () => void
}

/** Ord och bild: hear "Var är solen?" and tap the picture. */
export function WordPicture({ seed, onExit, onPlayAgain }: WordPictureProps) {
  const [round] = useState(() => createWordPictureRound({ seed, words }))

  return (
    <ChoiceChallenge
      round={round}
      voice={wordPictureVoice}
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
