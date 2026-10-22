import { SpeakerOffIcon } from '../ui/icons'
import { useVoiceStatus } from './useVoiceStatus'
import styles from './NoVoiceWarning.module.css'

/** For adults: the game can't speak Swedish on this device, so the child can't hear instructions. */
export function NoVoiceWarning() {
  const status = useVoiceStatus()
  if (status !== 'missing') return null

  return (
    <div className={styles.warning} role="status">
      <SpeakerOffIcon className={styles.icon} />
      Ingen svensk röst hittades på den här enheten
    </div>
  )
}
