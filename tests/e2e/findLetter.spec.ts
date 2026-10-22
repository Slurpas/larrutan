import { expect, test, type Locator, type Page } from '@playwright/test'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { confusableLetters, getLetter, letters } from '../../src/content/letters'

// A fixed seed makes the round predictable, so the test knows every answer.
const SEED = 4242
const round = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters })

/** Taps on touch devices (the real iPad path, where speech must be unlocked inside the tap), clicks elsewhere. */
function press(locator: Locator, hasTouch: boolean) {
  return hasTouch ? locator.tap() : locator.click()
}

async function startRound(page: Page, hasTouch: boolean) {
  await page.goto(`/?seed=${SEED}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
}

function letterButton(page: Page, id: string): Locator {
  return page.getByRole('button', { name: getLetter(id).display, exact: true })
}

async function waitForQuestion(page: Page, index: number) {
  await expect(page.getByRole('img', { name: `Fråga ${index + 1} av ${round.questions.length}` })).toBeVisible()
}

async function expectRoundComplete(page: Page) {
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible()
  await page.getByRole('button', { name: 'Till start' }).click()
  await expect(page.getByRole('button', { name: 'Spela' })).toBeVisible()
}

test('a round can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startRound(page, hasTouch)

  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index)
    await page.keyboard.press(String(question.choices.indexOf(question.target) + 1))
  }

  await expectRoundComplete(page)
})

test('a round can be completed by touch, including a wrong answer', async ({ page, hasTouch }) => {
  await startRound(page, hasTouch)

  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index)

    if (index === 0) {
      // A wrong tap greys that letter out but keeps it in place; the child can try again.
      const wrong = question.choices.find((choice) => choice !== question.target)!
      await press(letterButton(page, wrong), hasTouch)
      await expect(letterButton(page, wrong)).toBeDisabled()
      await expect(page.getByRole('img', { name: `Fråga 1 av ${round.questions.length}` })).toBeVisible()
    }

    await press(letterButton(page, question.target), hasTouch)
  }

  await expectRoundComplete(page)
})

test('Å, Ä and Ö show up as letters to tap', async ({ page, hasTouch }) => {
  const seenIds = new Set(round.questions.flatMap((q) => q.choices))
  const nordic = ['a-ring', 'a-umlaut', 'o-umlaut'].filter((id) => seenIds.has(id))
  expect(nordic.length, 'pick a seed whose round shows at least one of Å, Ä, Ö').toBeGreaterThan(0)

  await startRound(page, hasTouch)
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index)
    for (const id of question.choices) await expect(letterButton(page, id)).toBeVisible()
    await page.keyboard.press(String(question.choices.indexOf(question.target) + 1))
  }
})
