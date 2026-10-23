import { composeCharacter, type Outfit } from '../art/outfit'
import { PixelSprite } from '../ui/PixelSprite'
import styles from './CharacterPreview.module.css'

interface CharacterPreviewProps {
  outfit: Outfit
}

/** The character, large, facing the child, in what they are wearing: the same renderer as the map (src/art/outfit.ts). */
export function CharacterPreview({ outfit }: CharacterPreviewProps) {
  return (
    <div className={styles.character} aria-hidden="true">
      <PixelSprite grid={composeCharacter('down', 0, outfit)} className={styles.body} />
    </div>
  )
}
