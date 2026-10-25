import type { Page } from '@playwright/test'
import { levelParams } from '../../src/challenges/levels'
import { spellingWords } from '../../src/challenges/spelling/createRound'
import { createWordPictureRound } from '../../src/challenges/wordPicture/createRound'
import { phrases } from '../../src/content/phrases'
import { getWord, words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, answerKey, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt, waitForQuestion } from './helpers'

const round = createWordPictureRound({ seed: SEED, words })
const total = round.questions.length

const pictureButton = (page: Page, id: string) =>
  page.getByRole('button', { name: getWord(id).base, exact: true })

test('Ord och bild can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'wordPicture')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page)
})

test('Ord och bild can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'wordPicture')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)

    if (index === 0) {
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(pictureButton(page, wrong), hasTouch)
      await expect(pictureButton(page, wrong)).toBeDisabled()
    }

    await press(pictureButton(page, question.target), hasTouch)
  }
  await expectRoundCompleteThenMap(page)
})

test('at the top level the word is written and never said: the child reads it', async ({ page, hasTouch }) => {
  const reading = createWordPictureRound({ seed: SEED, words, choiceCount: levelParams('wordPicture', 4).choices, targets: spellingWords(words) })
  await startChallengeAt(page, hasTouch, 'wordPicture', 4)
  for (const [index, question] of reading.questions.entries()) {
    await waitForQuestion(page, index, reading.questions.length)
    await expect(page.getByRole('button', { name: 'Lyssna på ordet' })).toHaveText(getWord(question.target).base.toLocaleUpperCase('sv'))
    expect(await hasSaid(page, phrases.wordPictureQuestion(getWord(question.target).definite))).toBe(false)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expectRoundCompleteThenMap(page)
  expect(await hasSaid(page, phrases.readWordQuestion)).toBe(true)
})
