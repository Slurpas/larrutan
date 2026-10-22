import { useState } from 'react'
import { phrases } from '../../content/phrases'
import { getWord, words } from '../../content/words'
import { Picture } from '../../ui/Picture'
import { ChoiceChallenge } from '../ChoiceChallenge'
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
      ask={(q) => phrases.wordPictureQuestion(getWord(q.target).definite)}
      reveal={(q) => phrases.hereIs(getWord(q.target).definite)}
      nameChoice={(id) => phrases.thatIs(getWord(id).indefinite)}
      complete={phrases.wordPictureComplete}
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
