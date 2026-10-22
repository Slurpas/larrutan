import { useEffect, useEffectEvent, useRef } from 'react'
import type { ChallengeId } from '../challenges/challengeIds'
import { phrases } from '../content/phrases'
import { XpBar } from '../rewards/XpBar'
import { speak } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { BagIcon, HouseIcon } from '../ui/icons'
import { createHubGame, type HubGame } from './hubGame'
import { hubMap } from './hubMap'
import styles from './HubWorld.module.css'

interface HubWorldProps {
  /** False while a challenge or "Mina saker" is open on top of the map. */
  active: boolean
  xp: number
  /** The worn hat (emoji), shown on the character. */
  hat: string | null
  onOpenStation: (challenge: ChallengeId) => void
  onOpenMyThings: () => void
  onHome: () => void
}

/**
 * The map the child walks around (Phaser), with React buttons on top. It stays
 * mounted while a challenge is open, so the child comes back to the same spot.
 */
export function HubWorld({ active, xp, hat, onOpenStation, onOpenMyThings, onHome }: HubWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HubGame | null>(null)
  const openStation = useEffectEvent((challenge: ChallengeId) => onOpenStation(challenge))

  useEffect(() => {
    if (!containerRef.current) return
    const hub = createHubGame(containerRef.current, {
      map: hubMap,
      onOpenStation: (challenge) => openStation(challenge),
    })
    hubRef.current = hub
    void speak(phrases.hubWelcome)
    return () => {
      hub.destroy()
      hubRef.current = null
    }
  }, [])

  useEffect(() => {
    hubRef.current?.setActive(active)
  }, [active])

  useEffect(() => {
    hubRef.current?.setHat(hat)
  }, [hat])

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
