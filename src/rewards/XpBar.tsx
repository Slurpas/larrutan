import type { CSSProperties } from 'react'
import { cx } from '../ui/cx'
import { levelForXp, levelProgress } from './rules'
import styles from './XpBar.module.css'

interface XpBarProps {
  xp: number
  /** XP before a round: the bar then fills up from there (from empty after a level-up). */
  fromXp?: number
  size?: 'normal' | 'large'
}

/** The child's level as a badge, and progress towards the next level as a filling bar. No numbers to read. */
export function XpBar({ xp, fromXp, size = 'normal' }: XpBarProps) {
  const level = levelForXp(xp)
  const to = levelProgress(xp)
  const from = fromXp === undefined ? to : levelForXp(fromXp) === level ? levelProgress(fromXp) : 0
  const fill = { '--from': `${from * 100}%`, '--to': `${to * 100}%` } as CSSProperties

  return (
    <div className={cx(styles.xp, size === 'large' && styles.large)} role="img" aria-label={`Nivå ${level}`}>
      <span className={styles.level}>{level}</span>
      <span className={styles.track}>
        <span className={styles.fill} style={fill} />
      </span>
    </div>
  )
}
