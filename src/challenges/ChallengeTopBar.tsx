import type { ReactNode } from 'react'
import { RoundButton } from '../ui/RoundButton'
import { cx } from '../ui/cx'
import { HouseIcon, SpeakerIcon } from '../ui/icons'
import type { Difficulty } from './difficulty'
import { RoundProgress } from './RoundProgress'
import styles from './ChallengeTopBar.module.css'

interface ChallengeTopBarProps {
  onExit: () => void
  onReplay: () => void
  difficulty: Difficulty
  /** How many difficulty levels the challenge has, for the level pips. */
  difficultyCount: number
  total: number
  current: number
  /** Shown next to the speaker, e.g. the word when there is no Swedish voice. */
  beside?: ReactNode
}

/** The same top bar on every challenge screen: home, the big speaker, level pips and progress stars. */
export function ChallengeTopBar({ onExit, onReplay, difficulty, difficultyCount, total, current, beside }: ChallengeTopBarProps) {
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
        {difficultyCount > 1 && (
          <span className={styles.level} role="img" aria-label={difficulty === 'hard' ? 'Svår nivå' : 'Lätt nivå'}>
            {Array.from({ length: difficultyCount }, (_, i) => (
              <span key={i} className={cx(styles.pip, i <= (difficulty === 'hard' ? 1 : 0) && styles.pipOn)} />
            ))}
          </span>
        )}
        <RoundProgress total={total} current={current} />
      </div>
    </div>
  )
}
