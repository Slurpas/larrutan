import styles from './Picture.module.css'

interface PictureProps {
  emoji: string
}

/** Placeholder picture: an emoji in a colour emoji font. Replaced by project art in Phase 2. */
export function Picture({ emoji }: PictureProps) {
  return (
    <span className={styles.picture} aria-hidden="true">
      {emoji}
    </span>
  )
}
