import { useState } from 'react'
import type { ChallengeId } from '../challenges/challengeIds'
import { FindLetter } from '../challenges/findLetter/FindLetter'
import { FirstLetter } from '../challenges/firstLetter/FirstLetter'
import { WordPicture } from '../challenges/wordPicture/WordPicture'
import { NoVoiceWarning } from '../speech/NoVoiceWarning'
import { unlockSpeech } from '../speech/speech'
import { HubWorld } from '../world/HubWorld'
import { RotateHint } from './RotateHint'
import { StartScreen } from './StartScreen'
import { randomSeed, readSeedFromUrl } from './seed'
import styles from './App.module.css'

interface OpenChallenge {
  id: ChallengeId
  seed: number
}

/** Start screen, or the map with at most one challenge open on top of it. */
type Screen = { name: 'start' } | { name: 'world'; challenge: OpenChallenge | null }

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
    setScreen({ name: 'world', challenge: null })
  }

  function openChallenge(id: ChallengeId, seed: number) {
    setScreen({ name: 'world', challenge: { id, seed } })
  }

  const backToMap = () => setScreen({ name: 'world', challenge: null })

  let challenge = null
  if (screen.name === 'world' && screen.challenge) {
    const { id, seed } = screen.challenge
    const Challenge = challengeComponents[id]
    challenge = (
      <div className={styles.overlay}>
        <Challenge
          key={`${id}-${seed}`}
          seed={seed}
          onExit={backToMap}
          onPlayAgain={() => openChallenge(id, randomSeed())}
        />
      </div>
    )
  }

  return (
    <>
      {screen.name === 'start' ? (
        <StartScreen onPlay={handlePlay} />
      ) : (
        <HubWorld
          active={screen.challenge === null}
          onOpenStation={(id) => openChallenge(id, readSeedFromUrl(window.location.search) ?? randomSeed())}
          onHome={() => setScreen({ name: 'start' })}
        />
      )}
      {challenge}
      <RotateHint />
      <NoVoiceWarning />
    </>
  )
}
