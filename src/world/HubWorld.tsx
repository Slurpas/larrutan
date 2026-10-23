import { useEffect, useEffectEvent, useRef } from 'react'
import { outfitKey, type Outfit } from '../art/outfit'
import type { ChallengeId } from '../challenges/challengeIds'
import { phrases } from '../content/phrases'
import { XpBar } from '../rewards/XpBar'
import { speak } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { BagIcon, HouseIcon } from '../ui/icons'
import type { HubGame } from './hubGame'
import { hubMap } from './hubMap'
import { loadHubGame } from './loadHubGame'
import styles from './HubWorld.module.css'

interface HubWorldProps {
  /** False while a challenge or "Mina saker" is open on top of the map. */
  active: boolean
  xp: number
  /** What the character wears. */
  outfit: Outfit
  onOpenStation: (challenge: ChallengeId) => void
  onOpenMyThings: () => void
  onHome: () => void
}

/**
 * The map the child walks around (Phaser), with React buttons on top. It stays
 * mounted while a challenge is open, so the child comes back to the same spot.
 */
export function HubWorld({ active, xp, outfit, onOpenStation, onOpenMyThings, onHome }: HubWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HubGame | null>(null)
  const openStation = useEffectEvent((challenge: ChallengeId) => onOpenStation(challenge))
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
        map: hubMap,
        onOpenStation: (challenge) => openStation(challenge),
      })
      hubRef.current = hub
      catchUp(hub)
    })
    void speak(phrases.hubWelcome)
    return () => {
      cancelled = true
      hubRef.current?.destroy()
      hubRef.current = null
    }
  }, [])

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
        <RoundButton label="Till start" onClick={onHome}>
          <HouseIcon />
        </RoundButton>
        <div className={styles.topRight}>
          <XpBar xp={xp} />
          <RoundButton label="Mina saker" onClick={onOpenMyThings}>
            <BagIcon />
          </RoundButton>
        </div>
      </div>
    </div>
  )
}
