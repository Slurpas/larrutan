import type { Page } from '@playwright/test'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'
import { expect, test } from './fixtures'
import { targetBubbles } from '../../src/challenges/bubbles/bubbleRules'
import { SEED, expectRoundCompleteThenMap, popAll, press, startChallenge, waitForQuestion } from './helpers'

const round = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters })
const total = round.questions.length

// Hitta bokstaven is Bubblor: several bubbles per letter, so tests take the first one still there.
const letterButton = (page: Page, id: string) =>
  page.getByRole('button', { name: getLetter(id).display, exact: true }).first()

// Bubbles are blown in and float away between questions.
const questionTimeout = 15_000
test.slow()

test('a round can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'findLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, questionTimeout)
    await popAll(page, question)
  }
  await expectRoundCompleteThenMap(page, questionTimeout)
})

test('a round can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'findLetter')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total, questionTimeout)

    if (index === 0) {
      // A wrong bubble doesn't pop: every bubble with that letter turns grey, in place; the child can try again.
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      const wrongBubbles = page.getByRole('button', { name: getLetter(wrong).display, exact: true })
      await expect(wrongBubbles).toHaveCount(2)
      for (const bubble of await wrongBubbles.all()) await expect(bubble).toBeDisabled()
      await waitForQuestion(page, 0, total)
    }

    // Every bubble with the right letter pops; the question is done when the last one does.
    const right = page.getByRole('button', { name: getLetter(question.target).display, exact: true })
    for (let popped = 0; popped < targetBubbles; popped++) {
      await expect(right).toHaveCount(targetBubbles - popped)
      await press(right.first(), hasTouch)
    }
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
    await popAll(page, question)
  }
})
