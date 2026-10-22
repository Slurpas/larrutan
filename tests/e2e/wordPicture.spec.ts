import { expect, test, type Page } from '@playwright/test'
import { createWordPictureRound } from '../../src/challenges/wordPicture/createRound'
import { getWord, words } from '../../src/content/words'
import { SEED, answerKey, expectRoundCompleteThenMenu, press, startChallenge, waitForQuestion } from './helpers'

const round = createWordPictureRound({ seed: SEED, words })
const total = round.questions.length

const pictureButton = (page: Page, id: string) =>
  page.getByRole('button', { name: getWord(id).base, exact: true })

test('Ord och bild can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'Ord och bild')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMenu(page)
})

test('Ord och bild can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'Ord och bild')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)

    if (index === 0) {
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(pictureButton(page, wrong), hasTouch)
      await expect(pictureButton(page, wrong)).toBeDisabled()
    }

    await press(pictureButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMenu(page)
})
