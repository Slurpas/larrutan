import { useEffect, useState } from 'react'
import type { Slot } from '../art/wardrobe'
import { phrases } from '../content/phrases'
import { playEffect, speak, stopSpeech } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, LockIcon, StarIcon } from '../ui/icons'
import { CharacterPreview } from './CharacterPreview'
import { ItemPreview } from './ItemPreview'
import { items, rarityNames, type Item } from './items'
import { newItems } from './progress'
import { Stars } from './Stars'
import { getProgress, markItemsSeen, useProgress, wearItem } from './store'
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
 * "Mina saker": the wardrobe. Tap an item to put it on (it replaces what was worn in the
 * same place), tap it again to take it off. Each row shows the child's own things, then
 * only the next one to earn, which says out loud how to earn it: a wall of locked cards
 * hid the child's few things (2026-10-24). Things new since the last visit are marked.
 * No countdowns, no pressure (PRD §10).
 */
export function MyThings({ onClose }: MyThingsProps) {
  const progress = useProgress()
  // Marked for this whole visit; from now on they aren't new any more (the map's button stops pointing here).
  const [fresh] = useState(() => newItems(getProgress()))

  useEffect(() => {
    markItemsSeen()
    void speak(phrases.myThingsHelp)
    return stopSpeech
  }, [])

  function handleItem(item: Item) {
    if (!progress.unlockedItems.includes(item.id)) {
      void speak(item.hint)
    } else {
      stopSpeech()
      playEffect('pop')
      wearItem(item.id)
    }
  }

  /** The child's own things in this row, then the next one to earn. */
  function shownIn(slot: Slot): Item[] {
    const row = items.filter((item) => item.slot === slot)
    const owned = row.filter((item) => progress.unlockedItems.includes(item.id))
    const next = row.find((item) => !progress.unlockedItems.includes(item.id))
    return next ? [...owned, next] : owned
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
              {shownIn(slot).map((item) => {
                const unlocked = progress.unlockedItems.includes(item.id)
                const isWorn = progress.worn[item.slot] === item.id
                const isNew = fresh.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cx(styles.item, styles[`rarity${item.rarity}`], !unlocked && styles.locked, isWorn && styles.worn)}
                    aria-label={`${item.name}, ${rarityNames[item.rarity]}${unlocked ? '' : ', låst'}${isNew ? ', ny' : ''}`}
                    aria-pressed={unlocked ? isWorn : undefined}
                    onClick={() => handleItem(item)}
                  >
                    <ItemPreview itemId={item.id} className={styles.picture} />
                    {!unlocked && <LockIcon className={styles.lock} />}
                    {isNew && <StarIcon className={styles.newBadge} />}
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
