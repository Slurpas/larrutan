import type { CSSProperties } from 'react'
import { cx } from '../../ui/cx'
import { Picture } from '../../ui/Picture'
import type { FruitLevel } from '../levels'
import type { FruitQuestion } from './createRound'
import styles from './FruitSum.module.css'

interface FruitSumProps {
  question: FruitQuestion
  /** How much of the sum under the fruit shows (src/challenges/levels.ts). */
  shown: FruitLevel['shown']
  /** After a wrong answer: every fruit gets its number, to count by. */
  counting: boolean
  solved: boolean
}

/**
 * The two kinds of fruit, in rows of five, with the sum under them: "3 + 4 = 7" at first, then
 * less of it. A part's number has its fruit's colour (the user's idea: "3 (orange), 4 (yellow)").
 * After a wrong answer each fruit shows its number, counting on from the first kind into the
 * second; once solved, the answer shows in green.
 */
export function FruitSum({ question, shown, counting, solved }: FruitSumProps) {
  const [a, b] = question.parts
  const label = (value: number, visible: boolean) => (shown === 'nothing' ? null : visible ? String(value) : '?')
  const parts = [
    { count: a, fruit: question.fruits[0], first: 0, label: label(a, true) },
    { count: b, fruit: question.fruits[1], first: a, label: label(b, shown === 'all' || shown === 'parts') },
  ]
  // Both kinds of fruit are as tall as the taller one, so the numbers under them line up.
  const rows = Math.ceil(Math.max(a, b) / 5)
  return (
    <span className={styles.sum} style={{ '--rows': rows } as CSSProperties}>
      {parts.map((part, i) => [
        i > 0 && (
          <span key="plus" className={styles.sign}>
            +
          </span>
        ),
        <span key={part.fruit} className={styles.part}>
          <span className={styles.fruits} style={{ '--columns': Math.min(part.count, 5) } as CSSProperties}>
            {Array.from({ length: part.count }, (_, k) => (
              <span key={k} className={styles.fruit}>
                <Picture word={part.fruit} />
                {counting && <span className={styles.count}>{part.first + k + 1}</span>}
              </span>
            ))}
          </span>
          {part.label !== null && <span className={cx(styles.number, styles[part.fruit])}>{part.label}</span>}
        </span>,
      ])}
      <span className={styles.sign}>=</span>
      <span className={cx(styles.answer, solved && styles.solved)}>{shown === 'all' || solved ? question.target : '?'}</span>
    </span>
  )
}
