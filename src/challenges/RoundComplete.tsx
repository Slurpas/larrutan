import { useEffect } from 'react'
import { speak } from '../speech/speech'
import { RoundButton } from '../ui/RoundButton'
import { HouseIcon, ReplayIcon, StarIcon } from '../ui/icons'
import styles from './RoundComplete.module.css'

interface RoundCompleteProps {
  /** Said out loud when the screen appears. */
  message: string
  onPlayAgain: () => void
  onExit: () => void
}

export function RoundComplete({ message, onPlayAgain, onExit }: RoundCompleteProps) {
  useEffect(() => {
    void speak(message)
  }, [message])

  return (
    <main className={styles.screen}>
      <StarIcon className={styles.star} />
      <h1 className={styles.title}>Bra jobbat!</h1>
      <div className={styles.buttons}>
        <RoundButton label="Spela igen" size="large" onClick={onPlayAgain}>
          <ReplayIcon />
        </RoundButton>
        <RoundButton label="Till start" size="large" onClick={onExit}>
          <HouseIcon />
        </RoundButton>
      </div>
    </main>
  )
}
