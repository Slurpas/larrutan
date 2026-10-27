import type { Page } from '@playwright/test'
import { levelParams, type Level } from '../../src/challenges/levels'
import { createMowerRound, type Cell, type MowerRound } from '../../src/challenges/mower/createRound'
import { answerSum, currentSum, driveToward, isFinished, startMowing, type MowerState } from '../../src/challenges/mower/mowerState'
import { numberWord } from '../../src/content/numbers'
import { phrases } from '../../src/content/phrases'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt } from './helpers'

const roundAt = (level: Level) => {
  const { maxResult, minus, sums, choices } = levelParams('mower', level)
  return createMowerRound({ seed: SEED, maxResult, minus, sums, choices })
}
const cell = (page: Page, { col, row }: Cell) => page.locator(`[data-cell="${col},${row}"]`)
const sumShown = (page: Page) => page.getByRole('img', { name: / (plus|minus) / })
const number = (page: Page, value: string) => page.getByRole('button', { name: value, exact: true })

/**
 * Taps the next flower and follows the mower, in the game and in its rules side by side: it may
 * find another sum on the way, which then is the one asked. Returns the state with that sum asked.
 */
async function mowToNextSum(page: Page, round: MowerRound, state: MowerState, hasTouch: boolean): Promise<MowerState> {
  const spot = round.spots.find((_, i) => !state.found.includes(i))!
  await press(cell(page, spot), hasTouch)
  while (!state.asking) state = driveToward(state, spot)
  const sum = currentSum(state)!
  await expect(sumShown(page)).toHaveAccessibleName(`${sum.parts[0]} ${sum.sign === '+' ? 'plus' : 'minus'} ${sum.parts[1]}`, { timeout: 15_000 })
  return state
}

/** `revealed`: the answer pulses, the only one left, and Playwright only taps what holds still unless forced. */
async function answerRight(page: Page, state: MowerState, hasTouch: boolean, revealed = false): Promise<MowerState> {
  const sum = currentSum(state)!
  const button = number(page, sum.target)
  if (revealed) await (hasTouch ? button.tap({ force: true }) : button.click({ force: true }))
  else await press(button, hasTouch)
  // The right number shows green for a moment, then the mower may drive on.
  await expect(sumShown(page)).toBeHidden()
  return answerSum(state, sum.target).state
}

test('Gräsklipparen, in the town of maths: mowing over the flowers finds the sums, and answering them all ends the round', async ({ page, hasTouch }) => {
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'mower')
  await expect.poll(() => hasSaid(page, phrases.mowerIntro)).toBe(true)
  let state = startMowing(round)
  while (!isFinished(state)) {
    state = await mowToNextSum(page, round, state, hasTouch)
    await expect.poll(() => hasSaid(page, phrases.mowerQuestion)).toBe(true)
    state = await answerRight(page, state, hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})

test('a wrong number is named and greyed out; when only the answer is left it is pointed at', async ({ page, hasTouch }) => {
  const round = roundAt(2)
  await startChallengeAt(page, hasTouch, 'mower', 2)
  let state = await mowToNextSum(page, round, startMowing(round), hasTouch)
  const sum = currentSum(state)!
  const wrong = sum.choices.filter((choice) => choice !== sum.target)
  for (const choice of wrong) {
    await press(number(page, choice), hasTouch)
    await expect(number(page, choice)).toBeDisabled()
    await expect.poll(() => hasSaid(page, phrases.numberShort(numberWord(Number(choice))))).toBe(true)
  }
  await expect.poll(() => hasSaid(page, phrases.hereIs(numberWord(Number(sum.target))))).toBe(true)
  state = await answerRight(page, answerSum(state, wrong[0]!).state, hasTouch, true)
  expect(state.firstTry).toEqual([false])
})

test('the top level hides five sums, minus ones too, without dots', async ({ page, hasTouch }) => {
  test.slow()
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'mower', 4)
  let state = startMowing(round)
  while (!isFinished(state)) {
    state = await mowToNextSum(page, round, state, hasTouch)
    state = await answerRight(page, state, hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})
