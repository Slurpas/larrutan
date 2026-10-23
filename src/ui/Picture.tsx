import { pictures } from '../art/pictures'
import { cx } from './cx'
import { PixelSprite } from './PixelSprite'
import styles from './Picture.module.css'

interface PictureProps {
  /** The word whose picture to show (src/content/words.ts); the art is in src/art/pictures.ts. */
  word: string
  className?: string
}

/** A word's pixel-art picture. It sizes with the font, so a card sets its size with font-size. */
export function Picture({ word, className }: PictureProps) {
  const grid = pictures[word]
  if (!grid) throw new Error(`No picture for word "${word}"`)
  return <PixelSprite grid={grid} className={cx(styles.picture, className)} />
}
