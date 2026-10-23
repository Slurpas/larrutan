import type { Page } from '@playwright/test'
import { createFirstLetterRound } from '../../src/challenges/firstLetter/createRound'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, answerKey, expectRoundCompleteThenMap, press, startChallenge, waitForQuestion } from './helpers'

const round = createFirstLetterRound({ seed: SEED, words, letters, confusables: confusableLetters })
const total = round.questions.length

const letterButton = (page: Page, id: string) =>
  page.getByRole('button', { name: getLetter(id).display, exact: true })

// Första bokstaven is the mine cart: each question takes a few seconds of riding.
const rideTimeout = 15_000
test.slow()

test('Första bokstaven can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'firstLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, rideTimeout)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page, rideTimeout)
})

test('Första bokstaven can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'firstLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, rideTimeout)
    // The picture is shown and can be tapped to hear the word again.
    await expect(page.getByRole('button', { name: 'Lyssna på ordet' })).toBeVisible()

    if (index === 0) {
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      await expect(letterButton(page, wrong)).toBeDisabled()
    }

    await press(letterButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMap(page, rideTimeout)
})

test('the mine cart is steered onto a track and sent into its tunnel', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'firstLetter')
  const [first, second, third] = round.questions
  const steps = (choices: readonly string[], target: string) => choices.indexOf(target) - 1 // the cart starts in the middle

  // Arrow keys: over to the right track, then up into the tunnel.
  await waitForQuestion(page, 0, total, rideTimeout)
  const keySteps = steps(first!.choices, first!.target)
  for (let i = 0; i < Math.abs(keySteps); i++) await page.keyboard.press(keySteps > 0 ? 'ArrowRight' : 'ArrowLeft')
  await page.keyboard.press('ArrowUp')
  await waitForQuestion(page, 1, total, rideTimeout)

  if (hasTouch) return
  // A swipe (here with the mouse): sideways to steer, upwards to go.
  await expect(letterButton(page, second!.target)).toBeEnabled()
  const swipeSteps = steps(second!.choices, second!.target)
  const [x, y] = [640, 650]
  for (let i = 0; i < Math.abs(swipeSteps); i++) {
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x + (swipeSteps > 0 ? 120 : -120), y, { steps: 4 })
    await page.mouse.up()
  }
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y - 120, { steps: 4 })
  await page.mouse.up()
  await waitForQuestion(page, 2, total, rideTimeout)

  // A tap on the ground below a tunnel picks that track (once the wall has stopped moving).
  await letterButton(page, third!.target).click({ trial: true })
  const card = await letterButton(page, third!.target).boundingBox()
  if (!card) throw new Error('no card')
  await page.mouse.click(card.x + card.width / 2, card.y + card.height + 90)
  await waitForQuestion(page, 3, total, rideTimeout)
})
