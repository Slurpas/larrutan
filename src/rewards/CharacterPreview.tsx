import { Picture } from '../ui/Picture'
import styles from './CharacterPreview.module.css'

interface CharacterPreviewProps {
  /** Emoji of the worn hat, if any. */
  hat: string | null
}

/**
 * The placeholder character, large, matching the one on the map (HubScene).
 * Phase 2 replaces both with one shared pixel-art renderer (PRD §9).
 */
export function CharacterPreview({ hat }: CharacterPreviewProps) {
  return (
    <div className={styles.character} aria-hidden="true">
      {hat && (
        <span className={styles.hat}>
          <Picture emoji={hat} />
        </span>
      )}
      <svg className={styles.body} viewBox="-8 -8 16 16">
        <circle r="6" fill="#ff8a5b" stroke="var(--color-ink)" strokeWidth="1.2" />
        <circle cx="-2.1" cy="-1.2" r="0.9" fill="var(--color-ink)" />
        <circle cx="2.1" cy="-1.2" r="0.9" fill="var(--color-ink)" />
        <path d="M-1.9 1.4 A2.4 2.4 0 0 0 1.9 1.4" fill="none" stroke="var(--color-ink)" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    </div>
  )
}
