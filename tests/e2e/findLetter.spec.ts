import { expect, test, type Page } from '@playwright/test'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { SEED, answerKey, expectRoundCompleteThenMenu, press, startChallenge, waitForQuestion } from './helpers'

const round = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters })
const total = round.questions.length

const letterButton = (page: Page, id: string) =>
  page.getByRole('button', { name: getLetter(id).display, exact: true })

test('a round can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'Hitta bokstaven')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMenu(page)
})

test('a round can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'Hitta bokstaven')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)

    if (index === 0) {
      // A wrong tap greys that letter out but keeps it in place; the child can try again.
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      await expect(letterButton(page, wrong)).toBeDisabled()
      await waitForQuestion(page, 0, total)
    }

    await press(letterButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMenu(page)
})

test('Å, Ä and Ö show up as letters to tap', async ({ page, hasTouch }) => {
  const seenIds = new Set(round.questions.flatMap((q) => q.choices))
  const nordic = ['a-ring', 'a-umlaut', 'o-umlaut'].filter((id) => seenIds.has(id))
  expect(nordic.length, 'pick a seed whose round shows at least one of Å, Ä, Ö').toBeGreaterThan(0)

  await startChallenge(page, hasTouch, 'Hitta bokstaven')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    for (const id of question.choices) await expect(letterButton(page, id)).toBeVisible()
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
})
