import type { Page } from '@playwright/test'
import { lookAlikeRule } from '../../src/challenges/difficulty'
import { levelParams, type Level } from '../../src/challenges/levels'
import { createMemoryRound, type MemoryRound } from '../../src/challenges/memory/createRound'
import { confusableLetters, letters } from '../../src/content/letters'
import { phrases } from '../../src/content/phrases'
import { words } from '../../src/content/words'
import { expect, test } from './fixtures'
import { SEED, expectRoundCompleteThenMap, hasSaid, press, startChallenge, startChallengeAt } from './helpers'

const boardAt = (level: Level) => {
  const { pairs, lookAlikes } = levelParams('memory', level)
  return createMemoryRound({ seed: SEED, words, letters, confusables: confusableLetters, difficulty: lookAlikeRule(lookAlikes), pairs })
}
const round = boardAt(1)
const position = (board: MemoryRound, id: string) => board.cards.findIndex((c) => c.id === id) + 1
const cardsOf = (board: MemoryRound, pair: string) => board.cards.filter((c) => c.pair === pair)
/** A card by its place on the board; face up, its name also says what it shows ("Kort 3: A"). */
const card = (page: Page, id: string, board = round) => page.getByRole('button', { name: new RegExp(`^Kort ${position(board, id)}(:|$)`) })

test('Memory can be completed with the keyboard', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'memory')
  for (const pair of round.pairs) {
    for (const c of cardsOf(round, pair)) await page.keyboard.press(String(position(round, c.id)))
    for (const c of cardsOf(round, pair)) await expect(card(page, c.id)).toBeDisabled()
  }
  await expectRoundCompleteThenMap(page)
})

test('Memory by touch: two cards that do not match turn back, a pair stays face up', async ({ page, hasTouch }) => {
  await startChallenge(page, hasTouch, 'memory')
  const [first, second] = round.pairs.map((pair) => cardsOf(round, pair)[0]!)
  await press(card(page, first!.id), hasTouch)
  await press(card(page, second!.id), hasTouch)
  await expect(card(page, second!.id)).toHaveAccessibleName(/^Kort \d+: /)
  await expect(card(page, second!.id)).toHaveAccessibleName(/^Kort \d+$/, { timeout: 5000 })
  await expect(card(page, first!.id)).toHaveAccessibleName(/^Kort \d+$/)

  for (const pair of round.pairs) {
    for (const c of cardsOf(round, pair)) await press(card(page, c.id), hasTouch)
    for (const c of cardsOf(round, pair)) await expect(card(page, c.id)).toBeDisabled()
  }
  await expectRoundCompleteThenMap(page)
})

test('says what is new only on the first round after the level went up', async ({ page, hasTouch }) => {
  // It used to say "Nu blir det svårare" at the start of every hard round (user feedback 2026-10-25).
  for (const [played, announced] of [
    [1, true],
    [2, false],
  ] as const) {
    await startChallengeAt(page, hasTouch, 'memory', 2, played)
    await expect(page.getByRole('button', { name: /^Kort \d+$/ })).toHaveCount(2 * levelParams('memory', 2).pairs)
    await expect.poll(() => hasSaid(page, phrases.memoryIntro)).toBe(true)
    expect(await hasSaid(page, phrases.moreCardsIntro), `last round at level ${played}`).toBe(announced)
  }
})

test('the top level has sixteen cards, and can be completed by touch', async ({ page, hasTouch }) => {
  const board = boardAt(4)
  await startChallengeAt(page, hasTouch, 'memory', 4)
  await expect(page.getByRole('button', { name: /^Kort \d+$/ })).toHaveCount(16)
  for (const pair of board.pairs) {
    for (const c of cardsOf(board, pair)) await press(card(page, c.id, board), hasTouch)
    for (const c of cardsOf(board, pair)) await expect(card(page, c.id, board)).toBeDisabled()
  }
  await expectRoundCompleteThenMap(page)
})
