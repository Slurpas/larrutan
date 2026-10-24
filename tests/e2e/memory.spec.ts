import type { Page } from '@playwright/test'
import { createMemoryRound } from '../../src/challenges/memory/createRound'
import { confusableLetters, letters } from '../../src/content/letters'
import { words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, press, startChallenge } from './helpers'

const round = createMemoryRound({ seed: SEED, words, letters, confusables: confusableLetters })
const position = (id: string) => round.cards.findIndex((c) => c.id === id) + 1
const cardsOf = (pair: string) => round.cards.filter((c) => c.pair === pair)
/** A card by its place on the board; face up, its name also says what it shows ("Kort 3: A"). */
const card = (page: Page, id: string) => page.getByRole('button', { name: new RegExp(`^Kort ${position(id)}(:|$)`) })

test('Memory can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'memory')
  for (const pair of round.pairs) {
    for (const c of cardsOf(pair)) await page.keyboard.press(String(position(c.id)))
    for (const c of cardsOf(pair)) await expect(card(page, c.id)).toBeDisabled()
  }
  await expectRoundCompleteThenMap(page)
})

test('Memory by touch: two cards that do not match turn back, a pair stays face up', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'memory')
  const [first, second] = round.pairs.map((pair) => cardsOf(pair)[0]!)
  await press(card(page, first!.id), hasTouch)
  await press(card(page, second!.id), hasTouch)
  await expect(card(page, second!.id)).toHaveAccessibleName(/^Kort \d+: /)
  await expect(card(page, second!.id)).toHaveAccessibleName(/^Kort \d+$/, { timeout: 5000 })
  await expect(card(page, first!.id)).toHaveAccessibleName(/^Kort \d+$/)

  for (const pair of round.pairs) {
    for (const c of cardsOf(pair)) await press(card(page, c.id), hasTouch)
    for (const c of cardsOf(pair)) await expect(card(page, c.id)).toBeDisabled()
  }
  await expectRoundCompleteThenMap(page)
})
