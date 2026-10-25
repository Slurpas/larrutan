import type { Page } from '@playwright/test'
import { lookAlikeRule } from '../../src/challenges/difficulty'
import { levelParams } from '../../src/challenges/levels'
import { createSpellingRound } from '../../src/challenges/spelling/createRound'
import { phrases } from '../../src/content/phrases'
import { getWord, words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt, waitForQuestion } from './helpers'

const round = createSpellingRound({ seed: SEED, words })
const total = round.questions.length

// Each built word is celebrated (its last letter, a chime, the word) for 2.4 s before the next.
test.slow()

/** The first bubble with this letter that is still in the game (popped ones are hidden). */
const bubble = (page: Page, letter: string) => page.getByRole('button', { name: letter, exact: true }).first()
/** The slots, showing the letters built so far. */
const built = (page: Page, letters: readonly string[]) => page.getByRole('group', { name: `Ordet: ${letters.join('')}`.trim(), exact: true })

/** A letter key. Playwright's keyboard has no Å, Ä or Ö, so those are sent as the key event a Swedish keyboard makes. */
async function pressLetter(page: Page, letter: string) {
  const key = letter.toLocaleLowerCase('sv')
  if (/^[a-z]$/.test(key)) await page.keyboard.press(key)
  else await page.evaluate((k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k })), key)
}

test('Bygg ordet can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'spelling')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)
    for (const letter of question.letters) await pressLetter(page, letter)
    await expect(built(page, question.letters)).toBeVisible()
  }
  await expectRoundCompleteThenMap(page)
})

test('Bygg ordet can be completed by touch, and a letter that is not in the word greys out', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'spelling')
  for (const [index, question] of round.questions.entries()) {
    await waitForQuestion(page, index, total)

    if (index === 0) {
      const stranger = question.bubbles.find((b) => !question.letters.includes(b.letter))!
      await press(bubble(page, stranger.letter), hasTouch)
      await expect(bubble(page, stranger.letter)).toBeDisabled()
      await expect(built(page, [])).toBeVisible()
    }

    for (const [i, letter] of question.letters.entries()) {
      await press(bubble(page, letter), hasTouch)
      await expect(built(page, question.letters.slice(0, i + 1))).toBeVisible()
    }
  }
  await expectRoundCompleteThenMap(page)
})

test('the top level hides the word and asks for words of up to five letters', async ({ page, hasTouch }) => {
  const { lookAlike, extraLetters, lengths } = levelParams('spelling', 4)
  const longer = createSpellingRound({ seed: SEED, words, difficulty: lookAlikeRule(lookAlike), extras: extraLetters, lengths })
  await startChallengeAt(page, hasTouch, 'spelling', 4)
  for (const [index, question] of longer.questions.entries()) {
    await waitForQuestion(page, index, longer.questions.length)
    expect(question.letters.length).toBeGreaterThanOrEqual(lengths[0])
    for (const letter of question.letters) await pressLetter(page, letter)
    await expect(built(page, question.letters)).toBeVisible()
  }
  await expectRoundCompleteThenMap(page)
})

test('letters are named: a popped bubble, a wrong one, and a tapped slot', async ({ page, hasTouch }) => {
  const [question] = round.questions
  const [first, second] = question!.letters
  await startChallenge(page, hasTouch, 'spelling')
  await waitForQuestion(page, 0, total)
  // A slot shows its letter faintly on the first level: tapping it names that letter.
  await press(page.getByRole('button', { name: 'Ruta 2' }), hasTouch)
  await expect.poll(() => hasSaid(page, phrases.letterShort(second!))).toBe(true)
  // A wrong bubble is named, then the word is said again.
  const stranger = question!.bubbles.find((b) => !question!.letters.includes(b.letter))!
  await press(bubble(page, stranger.letter), hasTouch)
  await expect.poll(() => hasSaid(page, phrases.letterShort(stranger.letter))).toBe(true)
  await expect.poll(() => hasSaid(page, phrases.firstLetterShort(getWord(question!.word).base))).toBe(true)
  // The right one is named as it lands.
  await press(bubble(page, first!), hasTouch)
  await expect(built(page, [first!])).toBeVisible()
  await expect.poll(() => hasSaid(page, phrases.letterShort(first!))).toBe(true)
})
