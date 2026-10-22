import styles from './StartScreen.module.css'

interface StartScreenProps {
  onPlay: () => void
}

export function StartScreen({ onPlay }: StartScreenProps) {
  return (
    <main className={styles.screen}>
      <div className={`${styles.cloud} ${styles.cloudLeft}`} aria-hidden="true" />
      <div className={`${styles.cloud} ${styles.cloudRight}`} aria-hidden="true" />
      <div className={styles.hill} aria-hidden="true" />

      <div className={styles.content}>
        <h1 className={styles.title}>Lärrutan</h1>
        <button type="button" className={styles.playButton} onClick={onPlay}>
          <svg className={styles.playIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
          </svg>
          Spela
        </button>
      </div>
    </main>
  )
}
