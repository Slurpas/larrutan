import { useState } from 'react'
import { FindLetter } from '../challenges/findLetter/FindLetter'
import { NoVoiceWarning } from '../speech/NoVoiceWarning'
import { unlockSpeech } from '../speech/speech'
import { RotateHint } from './RotateHint'
import { StartScreen } from './StartScreen'
import { randomSeed, readSeedFromUrl } from './seed'

export function App() {
  // null = start screen; otherwise the seed of the round being played.
  const [seed, setSeed] = useState<number | null>(null)

  function handlePlay() {
    // Must run inside the tap itself, or iPad Safari stays silent.
    unlockSpeech()
    setSeed(readSeedFromUrl(window.location.search) ?? randomSeed())
  }

  return (
    <>
      {seed === null ? (
        <StartScreen onPlay={handlePlay} />
      ) : (
        <FindLetter
          key={seed}
          seed={seed}
          onExit={() => setSeed(null)}
          onPlayAgain={() => setSeed(randomSeed())}
        />
      )}
      <RotateHint />
      <NoVoiceWarning />
    </>
  )
}
