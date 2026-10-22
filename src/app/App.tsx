import { useState } from 'react'
import { FindLetter } from '../challenges/findLetter/FindLetter'
import { FirstLetter } from '../challenges/firstLetter/FirstLetter'
import { WordPicture } from '../challenges/wordPicture/WordPicture'
import { NoVoiceWarning } from '../speech/NoVoiceWarning'
import { unlockSpeech } from '../speech/speech'
import { ChallengeMenu, type ChallengeId } from './ChallengeMenu'
import { RotateHint } from './RotateHint'
import { StartScreen } from './StartScreen'
import { randomSeed, readSeedFromUrl } from './seed'

type Screen = { name: 'start' } | { name: 'menu' } | { name: 'challenge'; challenge: ChallengeId; seed: number }

const challengeComponents = {
  findLetter: FindLetter,
  firstLetter: FirstLetter,
  wordPicture: WordPicture,
} satisfies Record<ChallengeId, unknown>

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' })

  function handlePlay() {
    // Must run inside the tap itself, or iPad Safari stays silent.
    unlockSpeech()
    setScreen({ name: 'menu' })
  }

  function startChallenge(challenge: ChallengeId, seed: number) {
    setScreen({ name: 'challenge', challenge, seed })
  }

  let content
  if (screen.name === 'start') {
    content = <StartScreen onPlay={handlePlay} />
  } else if (screen.name === 'menu') {
    content = (
      <ChallengeMenu
        onPick={(id) => startChallenge(id, readSeedFromUrl(window.location.search) ?? randomSeed())}
        onHome={() => setScreen({ name: 'start' })}
      />
    )
  } else {
    const Challenge = challengeComponents[screen.challenge]
    content = (
      <Challenge
        key={`${screen.challenge}-${screen.seed}`}
        seed={screen.seed}
        onExit={() => setScreen({ name: 'menu' })}
        onPlayAgain={() => startChallenge(screen.challenge, randomSeed())}
      />
    )
  }

  return (
    <>
      {content}
      <RotateHint />
      <NoVoiceWarning />
    </>
  )
}
