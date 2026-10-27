import type { Page } from '@playwright/test'
import { createFruitRound, type FruitQuestion } from '../../src/challenges/fruit/createRound'
import { levelParams, type Level } from '../../src/challenges/levels'
import { numberWord } from '../../src/content/numbers'
import { phrases } from '../../src/content/phrases'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt, waitForQuestion } from './helpers'

const roundAt = (level: Level) => {
  const { maxSum, choices } = levelParams('fruit', level)
  return createFruitRound({ seed: SEED, maxSum, choices })
}
const fruit = (page: Page) => page.getByRole('button', { name: 'Frågan igen' })
const number = (page: Page, value: string) => page.getByRole('button', { name: value, exact: true })
/** Answers every question right by touch, from `from` on. */
async function answerAll(page: Page, questions: readonly FruitQuestion[], hasTouch: boolean, from = 0) {
  for (const [i, q] of questions.entries()) {
    if (i < from) continue
    await waitForQuestion(page, i, questions.length)
    await press(number(page, q.target), hasTouch)
  }
}

test('Räkna frukterna, in the town of maths, can be completed with number keys: the whole sum is written at first', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'fruit')
  await expect.poll(() => hasSaid(page, phrases.fruitQuestion)).toBe(true)
  for (const [i, q] of round.questions.entries()) {
    await waitForQuestion(page, i, round.questions.length)
    const [a, b] = q.parts
    // "3 + 4 = 7": both parts and the answer are written under the fruit.
    await expect(fruit(page)).toContainText(`${a}+${b}=${q.target}`)
    await page.keyboard.press(q.target === '10' ? '0' : q.target)
  }
  await expectRoundCompleteThenMap(page)
})

test('by touch: a wrong number is named, and then every fruit shows its number to count by', async ({ page, hasTouch }) => {
  const round = roundAt(2)
  await startChallengeAt(page, hasTouch, 'fruit', 2)
  const q = round.questions[0]!
  const [a, b] = q.parts
  // "3 + 4 = ?": the parts, not the answer.
  await expect(fruit(page)).toContainText(`${a}+${b}=?`)
  await expect(fruit(page).getByText(q.target, { exact: true })).toHaveCount(0)
  const wrong = q.choices.find((choice) => choice !== q.target)!
  await press(number(page, wrong), hasTouch)
  await expect(number(page, wrong)).toBeDisabled()
  await expect.poll(() => hasSaid(page, phrases.numberShort(numberWord(Number(wrong))))).toBe(true)
  // The last fruit is number a + b.
  await expect(fruit(page).getByText(q.target, { exact: true })).toHaveCount(1)
  await answerAll(page, round.questions, hasTouch)
  await expectRoundCompleteThenMap(page)
})

test('the top level shows no numbers, only the fruit, and four numbers to choose from', async ({ page, hasTouch }) => {
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'fruit', 4)
  await waitForQuestion(page, 0, round.questions.length)
  await expect(fruit(page)).not.toContainText(/[0-9]/)
  await expect(page.getByRole('button', { name: /^\d+$/ })).toHaveCount(4)
  await answerAll(page, round.questions, hasTouch)
  await expectRoundCompleteThenMap(page)
})
