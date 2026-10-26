import { Pixels } from './pixels'

/**
 * Bokstavskorgarna: a wicker basket, seen from the front, with a rim and a woven body that
 * narrows towards the bottom. Its letter is UI on a tag (Andika), and the pictures put in it
 * stick up over the rim.
 */
export const basketSize = { width: 34, height: 22 } as const

export const basket: readonly string[] = (() => {
  const art = new Pixels(basketSize.width, basketSize.height)
  // The body: straw strands two pixels high, woven in front of and behind upright stakes, lit from above.
  art.polygon(
    [
      [2, 6],
      [32, 6],
      [28.5, 21],
      [5.5, 21],
    ],
    'L',
  )
  const inFront = (x: number, y: number) => Math.floor((x + (Math.floor((y - 6) / 2) % 2) * 3) / 6) % 2 === 0
  art.fill((x, y) => art.get(x, y) === 'L' && inFront(x, y) && Math.floor(y - 6) % 2 === 0, 'e')
  art.fill((x, y) => art.get(x, y) === 'L' && !inFront(x, y) && Math.floor(y - 6) % 2 === 1, 'd')
  // The rim: a rolled band of straw, twisted, with a shadow under it.
  art.rect(2, 1, 30, 4, 'L').rect(1, 2, 32, 2, 'L')
  art.fill((x, y) => y > 1 && y < 4 && Math.floor(x + y) % 4 === 0, 'd')
  art.rect(3, 1, 28, 1, 'e').rect(2, 4, 30, 1, 'd').rect(3, 5, 28, 1, 'D')
  return art.outline('o').toGrid()
})()
