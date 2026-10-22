import { StarIcon } from '../ui/icons'
import { rarityNames, type Rarity } from './items'
import styles from './Stars.module.css'

/** Rarity as 1–5 filled stars, so it never relies on colour alone. */
export function Stars({ rarity }: { rarity: Rarity }) {
  return (
    <span className={styles.stars} role="img" aria-label={`${rarityNames[rarity]}, ${rarity} av 5 stjärnor`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={n <= rarity ? styles.on : styles.off} />
      ))}
    </span>
  )
}
