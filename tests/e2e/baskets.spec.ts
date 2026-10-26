import type { Page } from '@playwright/test'
import { createBasketsRound, type BasketsRound } from '../../src/challenges/baskets/createRound'
import { lookAlikeRule } from '../../src/challenges/difficulty'
import { levelParams, type Level } from '../../src/challenges/levels'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { phrases } from '../../src/content/phrases'
import { getWord, words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt } from './helpers'

const roundAt = (level: Level) => {
  const { sets, picturesPerSet, piles, lookAlikes } = levelParams('baskets', level)
  return createBasketsRound({ seed: SEED, words, letters, confusables: confusableLetters, sets, picturesPerSet, piles, difficulty: lookAlikeRule(lookAlikes) })
}
/** What the game calls a picture: "Anka." */
const nameOf = (round: BasketsRound, id: string) => phrases.firstLetterShort(getWord(round.cards[id]!.word).base)
const letterName = (set: string) => phrases.letterShort(getLetter(set).spoken)
/** A pile's button; its name says the top picture ("Hög 2: Anka", "Hög 5: tom"). */
const pile = (page: Page, index: number) => page.getByRole('button', { name: new RegExp(`^Hög ${index + 1}:`) })
const basket = (page: Page, set: string) => page.getByRole('button', { name: `Korg ${getLetter(set).display}` })
/** Every picture, from the top of each pile down, with the basket it goes in. */
const solution = (round: BasketsRound) => round.piles.flatMap((cards, i) => [...cards].reverse().map((id) => ({ from: i, set: round.cards[id]!.set })))

test('Bokstavskorgarna can be completed with the keyboard: a number picks up, a letter puts it in that basket', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'baskets')
  for (const set of round.sets) await expect(basket(page, set)).toBeVisible()
  for (const { from, set } of solution(round)) {
    await page.keyboard.press(String(from + 1))
    // Playwright's keyboard has no Å, Ä or Ö, so the letter's key is sent as an event.
    await page.evaluate((key) => window.dispatchEvent(new KeyboardEvent('keydown', { key })), getLetter(set).display.toLocaleLowerCase('sv'))
  }
  await expectRoundCompleteThenMap(page)
})

test('by touch: a basket says its letter, a picture in the wrong basket comes back and both are named, and the rest can be sorted', async ({
  page,
  hasTouch,
}) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'baskets')
  const top = round.piles[0]!.at(-1)!
  const [wrong, other] = round.sets.filter((set) => set !== round.cards[top]!.set)
  await press(basket(page, other!), hasTouch)
  await expect.poll(() => hasSaid(page, letterName(other!))).toBe(true)

  await press(pile(page, 0), hasTouch)
  await expect(pile(page, 0)).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => hasSaid(page, nameOf(round, top))).toBe(true)
  await press(basket(page, wrong!), hasTouch)
  await expect(pile(page, 0)).toHaveAttribute('aria-pressed', 'false')
  await expect(pile(page, 0)).toHaveAccessibleName(`Hög 1: ${nameOf(round, top).slice(0, -1)}`)
  await expect.poll(() => hasSaid(page, letterName(wrong!))).toBe(true)

  for (const { from, set } of solution(round)) {
    await press(pile(page, from), hasTouch)
    await press(basket(page, set), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})

test('a picture can be dragged into its basket', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'Playwright cannot drag by touch; the mouse sends the same pointer events')
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'baskets')
  const top = round.piles[0]!.at(-1)!
  const set = round.cards[top]!.set
  const from = (await pile(page, 0).boundingBox())!
  const to = (await basket(page, set).boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + 60)
  await page.mouse.down()
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 })
  await page.mouse.up()
  await expect(pile(page, 0)).toHaveAccessibleName('Hög 1: tom')
  await expect(page.getByRole('button', { pressed: true })).toHaveCount(0)
  // The click at the end of the drag is not a tap on the basket (that would say its letter).
  await page.waitForTimeout(400)
  expect(await hasSaid(page, letterName(set))).toBe(false)
})

test('the top level has four baskets and sixteen pictures in four piles, and can be completed by touch', async ({ page, hasTouch }) => {
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'baskets', 4)
  await expect(page.getByRole('button', { name: /^Korg / })).toHaveCount(4)
  await expect(page.getByRole('button', { name: /^Hög \d+:/ })).toHaveCount(4)
  expect(Object.keys(round.cards)).toHaveLength(16)
  for (const { from, set } of solution(round)) {
    await press(pile(page, from), hasTouch)
    await press(basket(page, set), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})
