import type { Page } from '@playwright/test'
import { createAppleRound, type AppleQuestion } from '../../src/challenges/appleTree/createRound'
import { levelParams, type Level } from '../../src/challenges/levels'
import { numberWord } from '../../src/content/numbers'
import { phrases } from '../../src/content/phrases'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt, waitForQuestion } from './helpers'

const roundAt = (level: Level) => createAppleRound({ seed: SEED, ...levelParams('appleTree', level) })
const onTree = (page: Page) => page.locator('[data-where="tree"]')
const inBasket = (page: Page) => page.locator('[data-where="basket"]')
const number = (page: Page, value: string) => page.getByRole('button', { name: value, exact: true })
const said = (n: number) => phrases.numberShort(numberWord(n))

/** Picks `count` apples, one at a time: each lands in the basket before the next is tapped (an apple in flight ignores taps). */
async function pick(page: Page, count: number, hasTouch: boolean) {
  const before = await inBasket(page).count()
  for (let n = 1; n <= count; n++) {
    await press(onTree(page).first(), hasTouch)
    await expect(inBasket(page)).toHaveCount(before + n)
  }
}

/** Picks every apple on the tree. */
async function pickAll(page: Page, q: AppleQuestion, hasTouch: boolean) {
  await pick(page, q.count, hasTouch)
  await expect(onTree(page)).toHaveCount(0)
}

// Each of these plays several trees and waits for the basket to count itself aloud.
test.describe.configure({ timeout: 60_000 })

test('Äppelträdet, in the town of maths: pick every apple, counted aloud, then tap how many', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'appleTree')
  await expect.poll(() => hasSaid(page, phrases.appleTreeIntro)).toBe(true)
  for (const [i, q] of round.questions.entries()) {
    await waitForQuestion(page, i, round.questions.length)
    await expect(onTree(page)).toHaveCount(q.count)
    // No numbers to choose from until the tree is empty.
    await expect(number(page, q.target)).toHaveCount(0)
    for (let n = 1; n <= q.count; n++) {
      await press(onTree(page).first(), hasTouch)
      await expect(inBasket(page)).toHaveCount(n)
      // The game says the number, and the count shows it, until the question.
      if (n < q.count) await expect(page.locator(`[data-count="${n}"]`)).toBeVisible()
      await expect.poll(() => hasSaid(page, said(n))).toBe(true)
    }
    // The first time ever, the whole question; after that the short one.
    await expect.poll(() => hasSaid(page, i === 0 ? phrases.appleQuestion : phrases.fruitShort)).toBe(true)
    await press(number(page, q.target), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})

test('a wrong number is named, and then the apples in the basket count themselves', async ({ page, hasTouch }) => {
  const round = roundAt(2)
  await startChallengeAt(page, hasTouch, 'appleTree', 2, 1)
  await expect.poll(() => hasSaid(page, phrases.moreApplesIntro)).toBe(true)
  const q = round.questions[0]!
  await pickAll(page, q, hasTouch)
  const wrong = q.choices.find((choice) => choice !== q.target)!
  await press(number(page, wrong), hasTouch)
  await expect(number(page, wrong)).toBeDisabled()
  await expect.poll(() => hasSaid(page, said(Number(wrong)))).toBe(true)
  // Each apple gets its number, the last one the answer.
  await expect(page.locator(`[data-number="${q.count}"]`)).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('[data-number]')).toHaveCount(q.count)
  await press(number(page, q.target), hasTouch)
  await waitForQuestion(page, 1, round.questions.length)
  await expect(page.locator('[data-number]')).toHaveCount(0)
})

test('level 3: the apples already lie in the basket; touching one counts it, and number keys answer', async ({ page, hasTouch }) => {
  const round = roundAt(3)
  await startChallengeAt(page, hasTouch, 'appleTree', 3)
  for (const [i, q] of round.questions.entries()) {
    await waitForQuestion(page, i, round.questions.length)
    await expect(onTree(page)).toHaveCount(0)
    await expect(inBasket(page)).toHaveCount(q.count)
    await expect(page.getByRole('button', { name: /^\d+$/ })).toHaveCount(4)
    if (i === 0) {
      await press(inBasket(page).nth(2), hasTouch)
      await expect(inBasket(page).nth(2).locator('[data-number="1"]')).toBeVisible()
      await press(inBasket(page).nth(0), hasTouch)
      await expect(inBasket(page).nth(0).locator('[data-number="2"]')).toBeVisible()
    }
    await page.keyboard.press(q.target === '10' ? '0' : q.target)
  }
  await expectRoundCompleteThenMap(page)
})

test('level 4: pick as many as asked for; too many are counted, one goes back, and the tick takes the rest', async ({ page, hasTouch }) => {
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'appleTree', 4, 3)
  const done = page.getByRole('button', { name: 'Klar' })
  for (const [i, q] of round.questions.entries()) {
    await waitForQuestion(page, i, round.questions.length)
    await expect.poll(() => hasSaid(page, phrases.pickApples(numberWord(q.count)))).toBe(true)
    await expect(page.getByRole('img', { name: `${q.count} äpplen` })).toBeVisible()
    // More apples on the tree than asked for.
    await expect(onTree(page)).toHaveCount(q.spots.length)
    if (i === 0) {
      await expect.poll(() => hasSaid(page, phrases.appleDoneHint)).toBe(true)
      await pick(page, q.count + 1, hasTouch)
      await press(done, hasTouch)
      await expect(page.locator(`[data-number="${q.count + 1}"]`)).toBeVisible({ timeout: 15_000 })
      await expect.poll(() => hasSaid(page, phrases.tooMany), { timeout: 15_000 }).toBe(true)
      // Tapping an apple in the basket puts it back on the tree.
      await press(inBasket(page).last(), hasTouch)
      await expect(inBasket(page)).toHaveCount(q.count)
      await expect(page.locator('[data-number]')).toHaveCount(0)
    } else {
      await pick(page, q.count, hasTouch)
    }
    await press(done, hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})
