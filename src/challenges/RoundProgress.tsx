import { StarIcon } from '../ui/icons'
import { cx } from '../ui/cx'
import styles from './RoundProgress.module.css'

interface RoundProgressProps {
  total: number
  /** Index of the current question (0-based); earlier questions are done. */
  current: number
}

/** A row of stars that fill in as questions are answered. No numbers to read. */
export function RoundProgress({ total, current }: RoundProgressProps) {
  return (
    <div className={styles.progress} role="img" aria-label={`Fråga ${current + 1} av ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cx(styles.slot, index < current && styles.done, index === current && styles.current)}
        >
          {index < current && <StarIcon className={styles.star} />}
        </span>
      ))}
    </div>
  )
}
