import { useRef, useState } from 'react'
import type { ChallengeId } from '../challenges/challengeIds'
import { announcesLevel, stationLevel, type Level } from '../challenges/levels'
import { Baskets } from '../challenges/baskets/Baskets'
import { FindLetter } from '../challenges/findLetter/FindLetter'
import { FirstLetter } from '../challenges/firstLetter/FirstLetter'
import { Fruit } from '../challenges/fruit/Fruit'
import { Memory } from '../challenges/memory/Memory'
import { Sorting } from '../challenges/sorting/Sorting'
import { Spelling } from '../challenges/spelling/Spelling'
import { WordPicture } from '../challenges/wordPicture/WordPicture'
import { boxOf, practiceKey } from '../learning/mastery'
import { Home } from '../home/Home'
import { MyThings } from '../rewards/MyThings'
import { newItems } from '../rewards/progress'
import { getProgress, loadProgress, recordRound, useProgress } from '../rewards/store'
import { NoVoiceWarning } from '../speech/NoVoiceWarning'
import { unlockSpeech } from '../speech/speech'
import { VoiceDebug, voiceDebugRequested } from '../speech/VoiceDebug'
import { HubWorld } from '../world/HubWorld'
import { readPlaceFromUrl, type PlaceId } from '../world/places'
import { RotateHint } from './RotateHint'
import { StartScreen } from './StartScreen'
import { randomSeed, readSeedFromUrl } from './seed'
import styles from './App.module.css'

interface OpenChallenge {
  id: ChallengeId
  seed: number
  level: Level
  /** The station has just gone up to this level: its intro is said, once. */
  announceLevel: boolean
  /** Finished before (progress is saved), so the long instructions can be skipped. */
  knowsChallenge: boolean
  /** Unique for this round, so its reward can never be granted twice. */
  roundId: string
}

/** Start screen, or the map with at most one screen (a challenge, "Mina saker" or the child's room) on top of it. */
type Screen =
  | { name: 'start' }
  | {
      name: 'world'
      overlay:
        | null
        | { name: 'challenge'; challenge: OpenChallenge }
        /** `fromHome`: opened at the wardrobe in the child's room, so closing it goes back there. */
        | { name: 'myThings'; fromHome?: boolean }
        | { name: 'home' }
    }

const challengeComponents = {
  findLetter: FindLetter,
  firstLetter: FirstLetter,
  wordPicture: WordPicture,
  spelling: Spelling,
  memory: Memory,
  sorting: Sorting,
  baskets: Baskets,
  fruit: Fruit,
} satisfies Record<ChallengeId, unknown>

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'start' })
  /** Where the child is: the world, or a town (src/world/places.ts), and where they came from. */
  const [place, setPlace] = useState<PlaceId>('world')
  const [cameFrom, setCameFrom] = useState<PlaceId | null>(null)
  const goTo = (next: PlaceId) => {
    setCameFrom(place)
    setPlace(next)
  }
  const progress = useProgress()
  const roundCounter = useRef(0)

  function handlePlay() {
    // Must run inside the tap itself, or iPad Safari stays silent.
    unlockSpeech()
    // The saved game has almost always loaded by now; waiting makes sure nothing is played before it.
    void loadProgress().then(() => {
      setCameFrom(null)
      setPlace(readPlaceFromUrl(window.location.search) ?? 'world')
      setScreen({ name: 'world', overlay: null })
    })
  }

  /** Opens a challenge at the station's current level (src/challenges/levels.ts). */
  function openChallenge(id: ChallengeId, seed: number) {
    const { completedLevels, stations } = getProgress()
    const level = stationLevel(stations[id])
    const announceLevel = announcesLevel(stations[id])
    const knowsChallenge = completedLevels.some((key) => key.startsWith(`${id}:`))
    const roundId = `${id}:${level}:${seed}:${++roundCounter.current}`
    setScreen({
      name: 'world',
      overlay: { name: 'challenge', challenge: { id, seed, level, announceLevel, knowsChallenge, roundId } },
    })
  }

  const backToMap = () => setScreen({ name: 'world', overlay: null })
  const openHome = () => setScreen({ name: 'world', overlay: { name: 'home' } })

  let overlay = null
  if (screen.name === 'world' && screen.overlay?.name === 'challenge') {
    const { id, seed, level, announceLevel, knowsChallenge, roundId } = screen.overlay.challenge
    const Challenge = challengeComponents[id]
    overlay = (
      <Challenge
        key={roundId}
        seed={seed}
        level={level}
        announceLevel={announceLevel}
        knowsChallenge={knowsChallenge}
        practiceBox={(item) => boxOf(getProgress().mastery, practiceKey(id, item))}
        onRoundComplete={({ score, practiced }) => recordRound({ roundId, challenge: id, level, score, practiced })}
        onExit={backToMap}
        onPlayAgain={() => openChallenge(id, randomSeed())}
      />
    )
  } else if (screen.name === 'world' && screen.overlay?.name === 'myThings') {
    overlay = screen.overlay.fromHome ? <MyThings closeLabel="Tillbaka" onClose={openHome} /> : <MyThings onClose={backToMap} />
  } else if (screen.name === 'world' && screen.overlay?.name === 'home') {
    overlay = <Home onClose={backToMap} onOpenWardrobe={() => setScreen({ name: 'world', overlay: { name: 'myThings', fromHome: true } })} />
  }

  return (
    <>
      {screen.name === 'start' ? (
        <StartScreen onPlay={handlePlay} />
      ) : (
        <HubWorld
          key={place}
          place={place}
          from={cameFrom}
          active={screen.overlay === null}
          xp={progress.xp}
          outfit={progress.worn}
          hasNewItems={newItems(progress).length > 0}
          onOpenStation={(id) => openChallenge(id, readSeedFromUrl(window.location.search) ?? randomSeed())}
          onOpenTown={goTo}
          onOpenMyThings={() => setScreen({ name: 'world', overlay: { name: 'myThings' } })}
          onOpenHome={openHome}
          onLeave={() => (place === 'world' ? setScreen({ name: 'start' }) : goTo('world'))}
        />
      )}
      {overlay && <div className={styles.overlay}>{overlay}</div>}
      <RotateHint />
      <NoVoiceWarning />
      {voiceDebugRequested && <VoiceDebug />}
    </>
  )
}
