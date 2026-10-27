import { useEffect, useEffectEvent, useRef } from 'react'
import { characterPortrait, outfitKey, type Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { phrases } from '../content/phrases'
import { XpBar } from '../rewards/XpBar'
import { speak } from '../speech/speech'
import { cx } from '../ui/cx'
import { PixelSprite } from '../ui/PixelSprite'
import { RoundButton } from '../ui/RoundButton'
import { HouseIcon, MapIcon, StarIcon } from '../ui/icons'
import type { HubGame } from './hubGame'
import { loadHubGame } from './loadHubGame'
import { arrivalTile, places, type PlaceId } from './places'
import type { TownId } from './tileMap'
import styles from './HubWorld.module.css'

interface HubWorldProps {
  /** Which map: the world, or a town. Mount a new HubWorld for another place (a `key`). */
  place: PlaceId
  /** Where the child came from: back in the world, they stand outside that town. */
  from: PlaceId | null
  /** False while a challenge or "Mina saker" is open on top of the map. */
  active: boolean
  xp: number
  /** What the character wears. */
  outfit: Outfit
  /** Items earned since the child last looked in "Mina saker": its button calls for attention. */
  hasNewItems: boolean
  onOpenStation: (challenge: ChallengeId) => void
  /** The child walked to a town's sign on the world map. */
  onOpenTown: (town: TownId) => void
  onOpenMyThings: () => void
  /** The child went in at the door of their own house. */
  onOpenHome: () => void
  /** The top-left button: from a town back to the world, from the world to the start screen. */
  onLeave: () => void
}

/**
 * The map the child walks around (Phaser), with React buttons on top: the world, or a town.
 * It stays mounted while a challenge is open, so the child comes back to the same spot.
 */
export function HubWorld({ place, from, active, xp, outfit, hasNewItems, onOpenStation, onOpenTown, onOpenMyThings, onOpenHome, onLeave }: HubWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HubGame | null>(null)
  const openStation = useEffectEvent((challenge: ChallengeId) => onOpenStation(challenge))
  const openTown = useEffectEvent((town: TownId) => onOpenTown(town))
  const openMyThings = useEffectEvent(() => onOpenMyThings())
  const openHome = useEffectEvent(() => onOpenHome())
  // The game arrives after the first render, so it starts from whatever the props are by then.
  const catchUp = useEffectEvent((hub: HubGame) => {
    hub.setActive(active)
    hub.setOutfit(outfit)
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    // The signs' letters are drawn in Andika, so the font must be ready before the map is.
    const fontReady = document.fonts.load('700 96px Andika').catch(() => [])
    void Promise.all([loadHubGame(), fontReady]).then(([{ createHubGame }]) => {
      if (cancelled) return
      const hub = createHubGame(container, {
        ...places[place],
        start: arrivalTile(place, from),
        onOpenStation: (challenge) => openStation(challenge),
        onOpenTown: (town) => openTown(town),
        onOpenMyThings: () => openMyThings(),
        onOpenHome: () => openHome(),
      })
      hubRef.current = hub
      catchUp(hub)
    })
    // Said once, in the world, where the game starts; in a town the child already knows.
    if (place === 'world') void speak(phrases.hubWelcome)
    return () => {
      cancelled = true
      hubRef.current?.destroy()
      hubRef.current = null
    }
    // Mounted anew for another place (its `key`), so this runs once per place.
  }, [place, from])

  useEffect(() => {
    hubRef.current?.setActive(active)
  }, [active])

  // A new outfit object comes with every progress update; only redress when what is worn changed.
  const worn = outfitKey(outfit)
  const dress = useEffectEvent(() => hubRef.current?.setOutfit(outfit))
  useEffect(() => {
    dress()
  }, [worn])

  return (
    <div className={styles.hub}>
      <div ref={containerRef} className={styles.world} />
      <div className={styles.topBar}>
        {place === 'world' ? (
          <RoundButton label="Till start" onClick={onLeave}>
            <HouseIcon />
          </RoundButton>
        ) : (
          <RoundButton label="Till världen" onClick={onLeave}>
            <MapIcon />
          </RoundButton>
        )}
        <div className={styles.topRight}>
          <XpBar xp={xp} />
          {/* The child's own face, not an abstract bag: children didn't find their things (2026-10-24). */}
          <span className={cx(styles.myThings, hasNewItems && styles.hasNew)}>
            <RoundButton label={hasNewItems ? 'Mina saker, nya saker' : 'Mina saker'} onClick={onOpenMyThings}>
              <PixelSprite grid={characterPortrait(outfit)} className={styles.portrait} />
            </RoundButton>
            {hasNewItems && <StarIcon className={styles.newBadge} />}
          </span>
        </div>
      </div>
    </div>
  )
}
