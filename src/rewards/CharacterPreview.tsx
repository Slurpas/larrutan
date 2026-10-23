import { characterFrames, characterHeadTop, characterSize } from '../art/character'
import { PixelSprite } from '../ui/PixelSprite'
import { Picture } from '../ui/Picture'
import styles from './CharacterPreview.module.css'

interface CharacterPreviewProps {
  /** Emoji of the worn hat, if any. */
  hat: string | null
}

/**
 * The character, large: the same pixel art as on the map (src/art/character.ts),
 * facing the child. Hats are still emoji until the wardrobe (Task 10) draws them.
 */
export function CharacterPreview({ hat }: CharacterPreviewProps) {
  const standing = characterFrames.down[0] ?? []
  return (
    <div className={styles.character} aria-hidden="true" style={{ '--head-top': characterHeadTop / characterSize.height } as React.CSSProperties}>
      <PixelSprite grid={standing} className={styles.body} />
      {hat && (
        <span className={styles.hat}>
          <Picture emoji={hat} />
        </span>
      )}
    </div>
  )
}
