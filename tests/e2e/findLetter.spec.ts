import type { Page } from '@playwright/test'
import { lookAlikeRule } from '../../src/challenges/difficulty'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { levelParams } from '../../src/challenges/levels'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { expect, test } from './fixtures'
import { SEED, answerKey, expectRoundCompleteThenMap, press, startChallenge, startChallengeAt, waitForQuestion } from './helpers'

const round = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters })
const total = round.questions.length

// Hitta bokstaven is Mata draken: one letter cookie per letter.
const letterButton = (page: Page, id: string) => page.getByRole('button', { name: getLetter(id).display, exact: true })

// Each cookie flies to the dragon, which chews before the next question.
const questionTimeout = 15_000
test.slow()

test('a round can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'findLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, questionTimeout)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page, questionTimeout)
})

test('a round can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'findLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, questionTimeout)

    if (index === 0) {
      // The dragon says no to a wrong cookie: it comes back grey; the child can try again.
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      await expect(letterButton(page, wrong)).toBeDisabled()
      await waitForQuestion(page, 0, total)
    }

    await press(letterButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMap(page, questionTimeout)
})

test('Å, Ä and Ö show up as letters to tap', async ({ page, hasTouch }) => {
  const seenIds = new Set(round.questions.flatMap((q) => q.choices))
  const nordic = ['a-ring', 'a-umlaut', 'o-umlaut'].filter((id) => seenIds.has(id))
  expect(nordic.length, 'pick a seed whose round shows at least one of Å, Ä, Ö').toBeGreaterThan(0)

  await startChallenge(page, hasTouch, 'findLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, questionTimeout)
    for (const id of question.choices) await expect(letterButton(page, id)).toBeVisible()
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
})

test('a cookie can also be dragged to the dragon; dropping it elsewhere puts it back', async ({ page, hasTouch }) => {
  test.skip(hasTouch, 'dragged with the mouse')
  await startChallenge(page, hasTouch, 'findLetter')
  const first = round.questions[0]!
  await waitForQuestion(page, 0, total, questionTimeout)
  const cookie = letterButton(page, first.target)
  await cookie.click({ trial: true })
  const box = (await cookie.boundingBox())!
  const viewport = page.viewportSize()!
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2]

  // Dropped on the grass: back on the plate, still the same question.
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 40, y + 120, { steps: 5 })
  await page.mouse.up()
  await expect(page.getByRole('img', { name: `Fråga 1 av ${total}` })).toBeVisible()

  // Dropped on the dragon (bottom right): eaten, next question.
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(viewport.width - 120, viewport.height - 150, { steps: 8 })
  await page.mouse.up()
  await waitForQuestion(page, 1, total, questionTimeout)
})

test('the top level offers five cookies, look-alikes among them', async ({ page, hasTouch }) => {
  const { choices, lookAlikes, questions } = levelParams('findLetter', 4)
  const top = createFindLetterRound({
    seed: SEED,
    letters,
    confusables: confusableLetters,
    difficulty: lookAlikeRule(lookAlikes),
    choiceCount: choices,
    questionCount: questions,
  })
  await startChallengeAt(page, hasTouch, 'findLetter', 4)
  for (const [index, question] of top.questions.entries()) {
    await waitForQuestion(page, index, top.questions.length, questionTimeout)
    expect(question.choices).toHaveLength(5)
    for (const id of question.choices) await expect(letterButton(page, id)).toBeVisible()
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page, questionTimeout)
})
