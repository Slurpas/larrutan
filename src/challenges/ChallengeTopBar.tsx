import type { ReactNode } from 'react'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, SpeakerIcon } from '../ui/icons'
import { levelCount, type Level } from './levels'
import { RoundProgress } from './RoundProgress'
import styles from './ChallengeTopBar.module.css'

interface ChallengeTopBarProps {
  onExit: () => void
  onReplay: () => void
  /** The station's level, shown as pips. */
  level: Level
  total: number
  current: number
  /** Shown next to the speaker, e.g. the word when there is no Swedish voice. */
  beside?: ReactNode
}

/** The same top bar on every challenge screen: home, the big speaker, level pips and progress stars. */
export function ChallengeTopBar({ onExit, onReplay, level, total, current, beside }: ChallengeTopBarProps) {
  return (
    <div className={styles.topBar}>
      <RoundButton label="Till kartan" onClick={onExit}>
        <HouseIcon />
      </RoundButton>
      <div className={styles.prompt}>
        <RoundButton label="Lyssna igen" size="large" onClick={onReplay}>
          <SpeakerIcon />
        </RoundButton>
        {beside}
      </div>
      <div className={styles.status}>
        <span className={styles.level} role="img" aria-label={`Nivå ${level} av ${levelCount}`}>
          {Array.from({ length: levelCount }, (_, i) => (
            <span key={i} className={cx(styles.pip, i < level && styles.pipOn)} />
          ))}
        </span>
        <RoundProgress total={total} current={current} />
      </div>
    </div>
  )
}
