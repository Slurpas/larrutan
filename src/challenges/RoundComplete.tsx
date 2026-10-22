import { useEffect } from 'react'
import { phrases } from '../content/phrases'
import { getItem } from '../rewards/items'
import type { RoundOutcome } from '../rewards/progress'
import { Stars } from '../rewards/Stars'
import { XpBar } from '../rewards/XpBar'
import { speak } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, ReplayIcon, StarIcon } from '../ui/icons'
import { Picture } from '../ui/Picture'
import styles from './RoundComplete.module.css'

interface RoundCompleteProps {
  /** Said out loud when the screen appears. */
  message: string
  /** What this round earned; shown as a filling XP bar, a level-up and new items. */
  outcome: RoundOutcome | null
  onPlayAgain: () => void
  onExit: () => void
}

export function RoundComplete({ message, outcome, onPlayAgain, onExit }: RoundCompleteProps) {
  const levelUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
  const newItems = outcome?.newItems.map(getItem) ?? []

  useEffect(() => {
    const leveledUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
    const unlocked = outcome?.newItems.map(getItem) ?? []
    void speak([
      message,
      ...(leveledUp ? [phrases.levelUp] : []),
      ...unlocked.map((item) => phrases.itemUnlocked(item.indefinite)),
    ])
  }, [message, outcome])

  return (
    <main className={styles.screen}>
      <StarIcon className={cx(styles.star, outcome && styles.smallStar)} />
      <h1 className={styles.title}>Bra jobbat!</h1>

      {outcome && (
        <div className={styles.rewards}>
          <XpBar xp={outcome.xpAfter} fromXp={outcome.xpBefore} size="large" />
          {levelUp && <p className={styles.levelUp}>Ny nivå!</p>}
          {newItems.map((item) => (
            <div key={item.id} className={styles.newItem} aria-label={`Ny sak: ${item.name}`} role="img">
              <span className={styles.newItemPicture}>
                <Picture emoji={item.emoji} />
              </span>
              <Stars rarity={item.rarity} />
            </div>
          ))}
        </div>
      )}

      <div className={styles.buttons}>
        <RoundButton label="Spela igen" size="large" onClick={onPlayAgain}>
          <ReplayIcon />
        </RoundButton>
        <RoundButton label="Till kartan" size="large" onClick={onExit}>
          <HouseIcon />
        </RoundButton>
      </div>
    </main>
  )
}
