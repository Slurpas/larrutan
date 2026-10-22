import type { ReactNode } from 'react'
import { RoundButton } from '../ui/RoundButton'
import { HouseIcon } from '../ui/icons'
import { Picture } from '../ui/Picture'
import styles from './ChallengeMenu.module.css'

export type ChallengeId = 'findLetter' | 'firstLetter' | 'wordPicture'

const challenges: { id: ChallengeId; name: string; art: ReactNode }[] = [
  {
    id: 'findLetter',
    name: 'Hitta bokstaven',
    art: <span className={styles.letters}>AÖ</span>,
  },
  {
    id: 'firstLetter',
    name: 'Första bokstaven',
    art: (
      <>
        <Picture emoji="☀️" />
        <span className={styles.letters}>S</span>
      </>
    ),
  },
  {
    id: 'wordPicture',
    name: 'Ord och bild',
    art: (
      <>
        <Picture emoji="🍎" />
        <Picture emoji="🐭" />
      </>
    ),
  },
]

interface ChallengeMenuProps {
  onPick: (id: ChallengeId) => void
  onHome: () => void
}

/** Temporary way to pick a challenge until the hub world exists (Task 4). */
export function ChallengeMenu({ onPick, onHome }: ChallengeMenuProps) {
  return (
    <main className={styles.screen}>
      <div className={styles.topBar}>
        <RoundButton label="Till start" onClick={onHome}>
          <HouseIcon />
        </RoundButton>
      </div>
      <div className={styles.tiles}>
        {challenges.map((challenge) => (
          <button key={challenge.id} type="button" className={styles.tile} onClick={() => onPick(challenge.id)}>
            <span className={styles.art} aria-hidden="true">
              {challenge.art}
            </span>
            <span className={styles.name}>{challenge.name}</span>
          </button>
        ))}
      </div>
    </main>
  )
}
