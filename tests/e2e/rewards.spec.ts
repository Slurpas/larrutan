import { expect, test, type Page } from '@playwright/test'
import type { ChoiceRound } from '../../src/challenges/choiceQuestion'
import { createFindLetterRound } from '../../src/challenges/findLetter/createRound'
import { confusableLetters, letters } from '../../src/content/letters'
import { SEED, answerKey, enterMap, press, tapStation, waitForQuestion } from './helpers'

async function playRoundByKeyboard(page: Page, round: ChoiceRound) {
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, round.questions.length)
    await page.keyboard.press(answerKey(question.choices, question.target))
  }
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible()
}

const easyRound = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters, difficulty: 'easy' })
const hardRound = createFindLetterRound({ seed: SEED, letters, confusables: confusableLetters, difficulty: 'hard' })

test('a finished round unlocks the cap, which can be worn on the map', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await expect(page.getByRole('img', { name: 'Nivå 1' })).toBeVisible()

  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('img', { name: 'Lätt nivå' })).toBeVisible()
  await playRoundByKeyboard(page, easyRound)
  await expect(page.getByRole('img', { name: 'Ny sak: Keps' })).toBeVisible()
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)

  await press(page.getByRole('button', { name: 'Mina saker' }), hasTouch)
  const cap = page.getByRole('button', { name: 'Keps, Vanlig' })
  await expect(cap).toHaveAttribute('aria-pressed', 'false')
  // Locked items are visible, with their rarity, but can't be worn.
  await expect(page.getByRole('button', { name: 'Krona, Legendarisk, låst' })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Legendarisk, 5 av 5 stjärnor' })).toBeVisible()

  await press(cap, hasTouch)
  await expect(cap).toHaveAttribute('aria-pressed', 'true')
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
  await expect.poll(() => page.evaluate(() => window.__larrutanHub?.hat())).toBe('🧢')
})

test('the second visit is the hard level, which earns the top hat', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapStation(page, 'findLetter', hasTouch)
  await playRoundByKeyboard(page, easyRound)
  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)

  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('img', { name: 'Svår nivå' })).toBeVisible()
  await playRoundByKeyboard(page, hardRound)
  await expect(page.getByRole('img', { name: 'Ny sak: Hög hatt' })).toBeVisible()
})

test('progress resets on reload (no saving until Task 7)', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapStation(page, 'findLetter', hasTouch)
  await playRoundByKeyboard(page, easyRound)

  await page.reload()
  await enterMap(page, hasTouch)
  await expect(page.getByRole('img', { name: 'Nivå 1' })).toBeVisible()
  await press(page.getByRole('button', { name: 'Mina saker' }), hasTouch)
  await expect(page.getByRole('button', { name: 'Keps, Vanlig, låst' })).toBeVisible()
})
