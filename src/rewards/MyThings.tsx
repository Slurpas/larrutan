import { useEffect } from 'react'
import { phrases } from '../content/phrases'
import { speak, stopSpeech } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, LockIcon } from '../ui/icons'
import { Picture } from '../ui/Picture'
import { CharacterPreview } from './CharacterPreview'
import { getItem, items, rarityNames, type Item } from './items'
import { Stars } from './Stars'
import { useProgress, wearItem } from './store'
import { XpBar } from './XpBar'
import styles from './MyThings.module.css'

interface MyThingsProps {
  onClose: () => void
}

/**
 * "Mina saker": try on unlocked hats; locked ones show their stars and say
 * out loud how to earn them. No countdowns, no pressure (PRD §10).
 */
export function MyThings({ onClose }: MyThingsProps) {
  const progress = useProgress()
  const worn = progress.wornItem ? getItem(progress.wornItem) : null

  useEffect(() => {
    void speak(phrases.myThingsHelp)
    return stopSpeech
  }, [])

  function handleItem(item: Item) {
    if (!progress.unlockedItems.includes(item.id)) {
      void speak(item.hint)
    } else {
      stopSpeech()
      wearItem(progress.wornItem === item.id ? null : item.id)
    }
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <RoundButton label="Till kartan" onClick={onClose}>
          <HouseIcon />
        </RoundButton>
        <XpBar xp={progress.xp} />
      </div>

      <div className={styles.body}>
        <CharacterPreview hat={worn?.emoji ?? null} />
        <div className={styles.items}>
          {items.map((item) => {
            const unlocked = progress.unlockedItems.includes(item.id)
            const isWorn = progress.wornItem === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={cx(styles.item, styles[`rarity${item.rarity}`], !unlocked && styles.locked, isWorn && styles.worn)}
                aria-label={`${item.name}, ${rarityNames[item.rarity]}${unlocked ? '' : ', låst'}`}
                aria-pressed={unlocked ? isWorn : undefined}
                onClick={() => handleItem(item)}
              >
                <span className={styles.picture}>
                  <Picture emoji={item.emoji} />
                </span>
                {!unlocked && <LockIcon className={styles.lock} />}
                <Stars rarity={item.rarity} />
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}
