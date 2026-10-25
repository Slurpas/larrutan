import { useEffect } from 'react'
import { composeCharacter } from '../art/outfit'
import { phrases } from '../content/phrases'
import { getItem, type Item } from '../rewards/items'
import { levelCount } from './levels'
import type { RoundOutcome } from '../rewards/progress'
import { Stars } from '../rewards/Stars'
import { getProgress, markItemsSeen, useProgress, wearItem } from '../rewards/store'
import { XpBar } from '../rewards/XpBar'
import { playEffect, speak } from '../speech/speech'
import { PixelSprite } from '../ui/PixelSprite'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { CheckIcon, HouseIcon, ReplayIcon, StarIcon } from '../ui/icons'
import styles from './RoundComplete.module.css'

interface RoundCompleteProps {
  /** What this round earned; shown as a filling XP bar, a level-up and new items. */
  outcome: RoundOutcome | null
  onPlayAgain: () => void
  onExit: () => void
}

export function RoundComplete({ outcome, onPlayAgain, onExit }: RoundCompleteProps) {
  const { worn } = useProgress()
  const levelUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
  const newItems = outcome?.newItems.map(getItem) ?? []
  const harderNextTime = outcome?.levelChange === 'up'

  // A fanfare, then a sound and a few words for each new level or item, and whether the station gets harder.
  // Until the child has worn something, a new item also says that a tap puts it on.
  useEffect(() => {
    const leveledUp = outcome !== null && outcome.levelAfter > outcome.levelBefore
    const unlocked = outcome?.newItems.map(getItem) ?? []
    const wearsNothing = Object.keys(getProgress().worn).length === 0
    void speak([
      { sound: 'fanfare' },
      ...(leveledUp ? [{ sound: 'levelUp' } as const, phrases.levelUp] : []),
      ...unlocked.flatMap((item) => [{ sound: 'newItem' } as const, phrases.itemUnlocked(item.indefinite)]),
      ...(unlocked.length > 0 && wearsNothing ? [phrases.tapToWear] : []),
      ...(outcome?.levelChange === 'up' ? [phrases.nextTimeHarder] : []),
    ])
  }, [outcome])

  /** Right where it was earned: one tap puts it on, and the card shows the child wearing it. */
  function putOn(item: Item) {
    if (worn[item.slot] === item.id) return
    wearItem(item.id)
    markItemsSeen()
    playEffect('pop')
  }

  return (
    <main className={styles.screen}>
      <StarIcon className={cx(styles.star, outcome && styles.smallStar)} />
      <h1 className={styles.title}>Bra jobbat!</h1>

      {outcome && (
        <div className={styles.rewards}>
          <XpBar xp={outcome.xpAfter} fromXp={outcome.xpBefore} size="large" />
          {levelUp && <p className={styles.levelUp}>Ny nivå!</p>}
          {harderNextTime && (
            // The station's level pips: the new level fills in. The words are for adults; the voice says it.
            <p className={styles.harder} role="img" aria-label={`Nästa gång: svårare, nivå ${outcome.stationLevel} av ${levelCount}`}>
              {Array.from({ length: levelCount }, (_, i) => (
                <span
                  key={i}
                  className={cx(styles.pip, i < outcome.stationLevel - 1 && styles.pipOn, i === outcome.stationLevel - 1 && styles.pipNew)}
                />
              ))}
            </p>
          )}
          {newItems.map((item) => {
            const isWorn = worn[item.slot] === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={cx(styles.newItem, isWorn ? styles.newItemWorn : styles.tryOn)}
                aria-label={`Ny sak: ${item.name}, ${isWorn ? 'på' : 'ta på'}`}
                disabled={isWorn}
                onClick={() => putOn(item)}
              >
                {/* Before: the item alone. After the tap: the child in everything they wear. Back items from behind. */}
                <PixelSprite
                  grid={composeCharacter(item.slot === 'back' ? 'up' : 'down', 0, isWorn ? worn : { [item.slot]: item.id })}
                  className={styles.newItemPicture}
                />
                <Stars rarity={item.rarity} />
                {isWorn && <CheckIcon className={styles.wornBadge} />}
              </button>
            )
          })}
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
