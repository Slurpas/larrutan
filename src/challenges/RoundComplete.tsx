import { useEffect } from 'react'
import { phrases } from '../content/phrases'
import { getItem } from '../rewards/items'
import { ItemPreview } from '../rewards/ItemPreview'
import type { RoundOutcome } from '../rewards/progress'
import { Stars } from '../rewards/Stars'
import { XpBar } from '../rewards/XpBar'
import { speak } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, ReplayIcon, StarIcon } from '../ui/icons'
import styles from './RoundComplete.module.css'

interface RoundCompleteProps {
  /** What this round earned; shown as a filling XP bar, a level-up and new items. */
  outcome: RoundOutcome | null
  onPlayAgain: () => void
  onExit: () => void
}

export function RoundComplete({ outcome, onPlayAgain, onExit }: RoundCompleteProps) {
  const levelUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
  const newItems = outcome?.newItems.map(getItem) ?? []

  // A fanfare, then a sound and a few words for each new level or item.
  useEffect(() => {
    const leveledUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
    const unlocked = outcome?.newItems.map(getItem) ?? []
    void speak([
      { sound: 'fanfare' },
      ...(leveledUp ? [{ sound: 'levelUp' } as const, phrases.levelUp] : []),
      ...unlocked.flatMap((item) => [{ sound: 'newItem' } as const, phrases.itemUnlocked(item.indefinite)]),
    ])
  }, [outcome])

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
              <ItemPreview itemId={item.id} className={styles.newItemPicture} />
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
