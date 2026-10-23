import { composeCharacter } from '../art/outfit'
import { PixelSprite } from '../ui/PixelSprite'
import { getItem } from './items'

interface ItemPreviewProps {
  itemId: string
  className?: string
}

/**
 * An item, shown worn by the character, so a child sees what it looks like on them
 * (also for locked items, PRD §10). Things worn on the back are shown from behind.
 */
export function ItemPreview({ itemId, className }: ItemPreviewProps) {
  const { slot } = getItem(itemId)
  return <PixelSprite grid={composeCharacter(slot === 'back' ? 'up' : 'down', 0, { [slot]: itemId })} className={className} />
}
