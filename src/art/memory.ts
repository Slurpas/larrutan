import { Pixels } from './pixels'

/**
 * Memory: the back of a card, the same on every card until it is turned. Blue with a light
 * frame and a yellow star. The faces are UI: a letter in Andika, or the word's picture.
 */
export const cardBack: readonly string[] = (() => {
  const back = new Pixels(20, 20)
  back.rect(0, 0, 20, 20, 'u')
  back.rect(2, 2, 16, 1, 'U').rect(2, 17, 16, 1, 'U').rect(2, 2, 1, 16, 'U').rect(17, 2, 1, 16, 'U')
  const star = new Pixels(20, 20)
  const corners = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5
    const radius = i % 2 === 0 ? 6.9 : 3.4
    return [10 + radius * Math.cos(angle), 10.9 + radius * Math.sin(angle)] as const
  })
  star.polygon(corners, 'y').shade('y', 'Y', (x, y) => x + y >= 23).set(9, 7, 'w').outline('o')
  return back.draw(star.toGrid(), 0, 0).toGrid()
})()
