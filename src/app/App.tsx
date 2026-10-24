import { useRef, useState } from 'react'
import type { ChallengeId } from '../challenges/challengeIds'
import { nextDifficulty, type Difficulty } from '../challenges/difficulty'
import { FindLetter } from '../challenges/findLetter/FindLetter'
import { FirstLetter } from '../challenges/firstLetter/FirstLetter'
import { Spelling } from '../challenges/spelling/Spelling'
import { WordPicture } from '../challenges/wordPicture/WordPicture'
import { boxOf, practiceKey } from '../learning/mastery'
import { MyThings } from '../rewards/MyThings'
import { getProgress, loadProgress, recordRound, useProgress } from '../rewards/store'
import { NoVoiceWarning } from '../speech/NoVoiceWarning'
import { unlockSpeech } from '../speech/speech'
import { VoiceDebug, voiceDebugRequested } from '../speech/VoiceDebug'
import { HubWorld } from '../world/HubWorld'
import { RotateHint } from './RotateHint'
import { StartScreen } from './StartScreen'
import { randomSeed, readSeedFromUrl } from './seed'
import styles from './App.module.css'

interface OpenChallenge {
  id: ChallengeId
  seed: number
  difficulty: Difficulty
  /** Finished before (progress is saved), so the long instructions can be skipped. */
  knowsChallenge: boolean
  /** Unique for this round, so its reward can never be granted twice. */
  roundId: string
}

/** Start screen, or the map with at most one screen (a challenge or "Mina saker") on top of it. */
type Screen =
  | { name: 'start' }
  | { name: 'world'; overlay: null | { name: 'challenge'; challenge: OpenChallenge } | { name: 'myThings' } }

const challengeComponents = {
  findLetter: FindLetter,
  firstLetter: FirstLetter,
  wordPicture: WordPicture,
  spelling: Spelling,
} satisfies Record<ChallengeId, unknown>

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' })
  const progress = useProgress()
  const roundCounter = useRef(0)

  function handlePlay() {
    // Must run inside the tap itself, or iPad Safari stays silent.
    unlockSpeech()
    // The saved game has almost always loaded by now; waiting makes sure nothing is played before it.
    void loadProgress().then(() => setScreen({ name: 'world', overlay: null }))
  }

  /** Opens a challenge at the station's current level (src/challenges/difficulty.ts). */
  function openChallenge(id: ChallengeId, seed: number) {
    const { completedLevels, levels } = getProgress()
    const difficulty = nextDifficulty(id, levels)
    const knowsChallenge = completedLevels.some((level) => level.startsWith(`${id}:`))
    const roundId = `${id}:${difficulty}:${seed}:${++roundCounter.current}`
    setScreen({
      name: 'world',
      overlay: { name: 'challenge', challenge: { id, seed, difficulty, knowsChallenge, roundId } },
    })
  }

  const backToMap = () => setScreen({ name: 'world', overlay: null })

  let overlay = null
  if (screen.name === 'world' && screen.overlay?.name === 'challenge') {
    const { id, seed, difficulty, knowsChallenge, roundId } = screen.overlay.challenge
    const Challenge = challengeComponents[id]
    overlay = (
      <Challenge
        key={roundId}
        seed={seed}
        difficulty={difficulty}
        knowsChallenge={knowsChallenge}
        practiceBox={(item) => boxOf(getProgress().mastery, practiceKey(id, item))}
        onRoundComplete={({ wrongTaps, practiced }) => recordRound({ roundId, challenge: id, difficulty, wrongTaps, practiced })}
        onExit={backToMap}
        onPlayAgain={() => openChallenge(id, randomSeed())}
      />
    )
  } else if (screen.name === 'world' && screen.overlay?.name === 'myThings') {
    overlay = <MyThings onClose={backToMap} />
  }

  return (
    <>
      {screen.name === 'start' ? (
        <StartScreen onPlay={handlePlay} />
      ) : (
        <HubWorld
          active={screen.overlay === null}
          xp={progress.xp}
          outfit={progress.worn}
          onOpenStation={(id) => openChallenge(id, readSeedFromUrl(window.location.search) ?? randomSeed())}
          onOpenMyThings={() => setScreen({ name: 'world', overlay: { name: 'myThings' } })}
          onHome={() => setScreen({ name: 'start' })}
        />
      )}
      {overlay && <div className={styles.overlay}>{overlay}</div>}
      <RotateHint />
      <NoVoiceWarning />
      {voiceDebugRequested && <VoiceDebug />}
    </>
  )
}
