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

test('Första bokstaven can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'firstLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page)
})

test('Första bokstaven can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'firstLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    // The picture is shown and can be tapped to hear the word again.
    await expect(page.getByRole('button', { name: 'Lyssna på ordet' })).toBeVisible()

    if (index === 0) {
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      await expect(letterButton(page, wrong)).toBeDisabled()
    }

    await press(letterButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})
