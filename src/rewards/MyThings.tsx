import { useEffect } from 'react'
import type { Slot } from '../art/wardrobe'
import { phrases } from '../content/phrases'
import { speak, stopSpeech } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, LockIcon } from '../ui/icons'
import { CharacterPreview } from './CharacterPreview'
import { ItemPreview } from './ItemPreview'
import { items, rarityNames, type Item } from './items'
import { Stars } from './Stars'
import { useProgress, wearItem } from './store'
import { XpBar } from './XpBar'
import styles from './MyThings.module.css'

/** One row per slot, so each row is one kind of thing; the names are for adults and screen readers. */
const slotRows: { slot: Slot; name: string }[] = [
  { slot: 'head', name: 'På huvudet' },
  { slot: 'top', name: 'Tröjor' },
  { slot: 'bottoms', name: 'Byxor' },
  { slot: 'back', name: 'På ryggen' },
  { slot: 'held', name: 'I handen' },
]

interface MyThingsProps {
  onClose: () => void
}

/**
 * "Mina saker": the wardrobe. Tap an unlocked item to put it on (it replaces what
 * was worn in the same place), tap it again to take it off. Locked items show
 * their stars and say out loud how to earn them. No countdowns, no pressure (PRD §10).
 */
export function MyThings({ onClose }: MyThingsProps) {
  const progress = useProgress()

  useEffect(() => {
    void speak(phrases.myThingsHelp)
    return stopSpeech
  }, [])

  function handleItem(item: Item) {
    if (!progress.unlockedItems.includes(item.id)) {
      void speak(item.hint)
    } else {
      stopSpeech()
      wearItem(item.id)
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
        <CharacterPreview outfit={progress.worn} />
        <div className={styles.rows}>
          {slotRows.map(({ slot, name }) => (
            <div key={slot} className={styles.row} role="group" aria-label={name}>
              {items
                .filter((item) => item.slot === slot)
                .map((item) => {
                  const unlocked = progress.unlockedItems.includes(item.id)
                  const isWorn = progress.worn[item.slot] === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={cx(styles.item, styles[`rarity${item.rarity}`], !unlocked && styles.locked, isWorn && styles.worn)}
                      aria-label={`${item.name}, ${rarityNames[item.rarity]}${unlocked ? '' : ', låst'}`}
                      aria-pressed={unlocked ? isWorn : undefined}
                      onClick={() => handleItem(item)}
                    >
                      <ItemPreview itemId={item.id} className={styles.picture} />
                      {!unlocked && <LockIcon className={styles.lock} />}
                      <Stars rarity={item.rarity} />
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
