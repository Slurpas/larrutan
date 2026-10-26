import type { Page } from '@playwright/test'
import { lookAlikeRule } from '../../src/challenges/difficulty'
import { levelParams, type Level } from '../../src/challenges/levels'
import { createSortingRound, freePiles, type SortingRound } from '../../src/challenges/sorting/createRound'
import { solve } from '../../src/challenges/sorting/sortingState'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { phrases } from '../../src/content/phrases'
import { getWord, words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt } from './helpers'

const roundAt = (level: Level) => {
  const { sets, cardsPerSet, lookAlikes } = levelParams('sorting', level)
  return createSortingRound({ seed: SEED, words, letters, confusables: confusableLetters, sets, cardsPerSet, difficulty: lookAlikeRule(lookAlikes) })
}
/** The solver's moves, played as the child sees the level (matching face-up cards move together). */
const movesAt = (level: Level) => solve(roundAt(level), levelParams('sorting', level).hidden)
/** What the game calls a card: "A." or "Anka." */
const nameOf = (round: SortingRound, id: string) => {
  const card = round.cards[id]!
  return card.kind === 'letter' ? phrases.letterShort(getLetter(card.set).spoken) : phrases.firstLetterShort(getWord(card.word!).base)
}
/** A pile's button; its name says the top card ("Hög 2: Anka", "Hög 5: tom"). */
const pile = (page: Page, index: number) => page.getByRole('button', { name: new RegExp(`^Hög ${index + 1}:`) })
const piles = (page: Page) => page.getByRole('button', { name: /^Hög \d+:/ })

test('Sortera korten can be completed with the keyboard', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'sorting')
  await expect(piles(page)).toHaveCount(round.sets.length + freePiles)
  for (const [from, to] of movesAt(1)) {
    await page.keyboard.press(String(from + 1))
    await page.keyboard.press(String(to + 1))
  }
  await expectRoundCompleteThenMap(page)
})

test('by touch: a card put on another letter comes back and both cards are named, and the rest can be sorted', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'sorting')
  const tops = round.piles.map((cards) => cards.at(-1))
  const moving = tops[0]!
  const to = tops.findIndex((id) => id !== undefined && round.cards[id]!.set !== round.cards[moving]!.set)
  await press(pile(page, 0), hasTouch)
  await expect(pile(page, 0)).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => hasSaid(page, nameOf(round, moving))).toBe(true)
  await press(pile(page, to), hasTouch)
  await expect(pile(page, 0)).toHaveAttribute('aria-pressed', 'false')
  await expect(pile(page, 0)).toHaveAccessibleName(`Hög 1: ${nameOf(round, moving).slice(0, -1)}`)
  await expect.poll(() => hasSaid(page, nameOf(round, tops[to]!))).toBe(true)

  for (const [from, onto] of movesAt(1)) {
    await press(pile(page, from), hasTouch)
    await press(pile(page, onto), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})

test('a card can be dragged to another pile', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'Playwright cannot drag by touch; the mouse sends the same pointer events')
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'sorting')
  const [from, to] = movesAt(1)[0]!
  const moving = round.piles[from]!.at(-1)!
  const a = (await pile(page, from).boundingBox())!
  const b = (await pile(page, to).boundingBox())!
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 3)
  await page.mouse.down()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 3, { steps: 10 })
  await page.mouse.up()
  await expect(pile(page, to)).toHaveAccessibleName(`Hög ${to + 1}: ${nameOf(round, moving).slice(0, -1)}`)
  // The click at the end of a drag is not a tap: nothing is picked up.
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(0)
})

test('the top level has four piles of four and two empty ones, and can be completed', async ({ page, hasTouch }) => {
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'sorting', 4)
  await expect(piles(page)).toHaveCount(round.sets.length + freePiles)
  expect(round.piles.slice(0, 4).every((pile) => pile.length === 4)).toBe(true)
  await expect(page.getByRole('button', { name: /^Hög \d+: tom$/ })).toHaveCount(freePiles)
  for (const [from, to] of movesAt(4)) {
    await page.keyboard.press(String(from + 1))
    await page.keyboard.press(String(to + 1))
  }
  await expectRoundCompleteThenMap(page)
})
