import styles from './RotateHint.module.css'

/**
 * Picture-only hint to turn the iPad sideways. Shown in portrait on touch
 * devices only, and never blocks the game (rotation lock may be on).
 */
export function RotateHint() {
  return (
    <div className={styles.hint} role="img" aria-label="Vänd skärmen så att den ligger ner">
      <svg className={styles.tablet} viewBox="0 0 40 56" aria-hidden="true">
        <rect x="2" y="2" width="36" height="52" rx="6" />
        <circle cx="20" cy="47" r="2.5" />
      </svg>
      <svg className={styles.arrow} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 13a8 8 0 1 0 2.6-5.9" />
        <path d="M4 3v5h5" />
      </svg>
    </div>
  )
}
