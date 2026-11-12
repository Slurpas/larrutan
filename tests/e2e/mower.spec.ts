import type { Page } from '@playwright/test'
import { levelParams, type Level } from '../../src/challenges/levels'
import { createMowerRound, sumDots, type Cell, type MowerQuestion, type MowerRound } from '../../src/challenges/mower/createRound'
import { answerSum, cellKey, currentSum, driveToward, isFinished, startMowing, type MowerState } from '../../src/challenges/mower/mowerState'
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

/** The sum on screen, with its dots where the level has them: all of them, and the ones crossed out (taken away in a minus sum). */
async function expectSum(page: Page, sum: MowerQuestion, level: Level) {
  await expect(sumShown(page)).toHaveAccessibleName(`${sum.parts[0]} ${sum.sign === '+' ? 'plus' : 'minus'} ${sum.parts[1]}`, { timeout: 15_000 })
  const dots = levelParams('mower', level).dots ? sumDots(sum) : []
  await expect(sumShown(page).locator('[data-dot]')).toHaveCount(dots.reduce((count, part) => count + part.dots, 0))
  await expect(sumShown(page).locator('[data-dot="crossed"]')).toHaveCount(dots.reduce((count, part) => count + part.crossed, 0))
}

/** `revealed`: the answer pulses, the only one left, and Playwright only taps what holds still unless forced. */
async function answerRight(page: Page, state: MowerState, hasTouch: boolean, revealed = false): Promise<MowerState> {
  const sum = currentSum(state)!
  const button = number(page, sum.target)
  if (revealed) await (hasTouch ? button.tap({ force: true }) : button.click({ force: true }))
  else await press(button, hasTouch)
  // The right number shows green for a moment, then the mower drives on.
  await expect(sumShown(page)).toBeHidden()
  return answerSum(state, sum.target).state
}

/**
 * Taps `goal` and follows the mower there, in the game and in its rules side by side: every sum
 * it finds on the way is answered, and then it drives on.
 */
async function mowTo(page: Page, state: MowerState, goal: Cell, hasTouch: boolean, level: Level): Promise<MowerState> {
  await press(cell(page, goal), hasTouch)
  while (state.mower.col !== goal.col || state.mower.row !== goal.row) {
    state = driveToward(state, goal)
    if (!state.asking) continue
    await expectSum(page, currentSum(state)!, level)
    state = await answerRight(page, state, hasTouch)
  }
  await expect(page.locator('[data-mower]')).toHaveAttribute('data-mower', cellKey(goal), { timeout: 15_000 })
  return state
}

/** The whole lawn, back and forth row by row, from the top. */
async function mowAll(page: Page, round: MowerRound, hasTouch: boolean, level: Level): Promise<MowerState> {
  let state = startMowing(round)
  for (let row = 0; row < round.rows; row++)
    for (const col of row % 2 === 0 ? [0, round.cols - 1] : [round.cols - 1, 0]) state = await mowTo(page, state, { col, row }, hasTouch, level)
  return state
}

test('Gräsklipparen, in the town of maths: mowing finds the sums, and the round ends when the whole lawn is mowed', async ({ page, hasTouch }) => {
  test.slow()
  const round = roundAt(1)
  await startChallenge(page, hasTouch, 'mower')
  await expect.poll(() => hasSaid(page, phrases.mowerIntro)).toBe(true)
  const state = await mowAll(page, round, hasTouch, 1)
  expect(isFinished(state)).toBe(true)
  expect(state.firstTry).toHaveLength(round.spots.length)
  await expect.poll(() => hasSaid(page, phrases.mowerQuestion)).toBe(true)
  await expectRoundCompleteThenMap(page)
})

test('a wrong number is named and greyed out; when only the answer is left it is pointed at', async ({ page, hasTouch }) => {
  const round = roundAt(2)
  await startChallengeAt(page, hasTouch, 'mower', 2)
  // Straight to a sum: the mower may find another one on the way, which is then the one asked.
  const spot = round.spots[0]!
  await press(cell(page, spot), hasTouch)
  let state = startMowing(round)
  while (!state.asking) state = driveToward(state, spot)
  const sum = currentSum(state)!
  await expectSum(page, sum, 2)
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

test('minus comes at level 3, with dots to count: the ones taken away are crossed out', async ({ page, hasTouch }) => {
  const round = roundAt(3)
  // With this seed the first sum is a minus one (5 − 3): five dots, three of them crossed out.
  expect(round.questions[0]).toMatchObject({ sign: '-' })
  await startChallengeAt(page, hasTouch, 'mower', 3, 2)
  await expect.poll(() => hasSaid(page, phrases.minusIntro)).toBe(true)
  const spot = round.spots[0]!
  await press(cell(page, spot), hasTouch)
  let state = startMowing(round)
  while (!state.asking) state = driveToward(state, spot)
  await expectSum(page, currentSum(state)!, 3)
  await expect(sumShown(page).locator('[data-dot="left"]')).toHaveCount(Number(currentSum(state)!.target))
  state = await answerRight(page, state, hasTouch)
  expect(state.firstTry).toEqual([true])
})

test('the top level hides five sums, minus ones too, without dots', async ({ page, hasTouch }) => {
  test.slow()
  const round = roundAt(4)
  await startChallengeAt(page, hasTouch, 'mower', 4)
  expect(round.questions).toHaveLength(5)
  expect(round.questions.some((q) => q.sign === '-')).toBe(true)
  const state = await mowAll(page, round, hasTouch, 4)
  expect(isFinished(state)).toBe(true)
  await expectRoundCompleteThenMap(page)
})
