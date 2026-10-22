import { expect, type Locator, type Page } from '@playwright/test'

/** Fixed seed: rounds are predictable, so tests know every answer. */
export const SEED = 4242

/** Taps on touch devices (the real iPad path, where speech must be unlocked inside the tap), clicks elsewhere. */
export function press(locator: Locator, hasTouch: boolean) {
  return hasTouch ? locator.tap() : locator.click()
}

export async function startChallenge(page: Page, hasTouch: boolean, name: string) {
  await page.goto(`/?seed=${SEED}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  await press(page.getByRole('button', { name }), hasTouch)
}

export async function waitForQuestion(page: Page, index: number, total: number) {
  await expect(page.getByRole('img', { name: `Fråga ${index + 1} av ${total}` })).toBeVisible()
}

export async function expectRoundCompleteThenMenu(page: Page) {
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible()
  await page.getByRole('button', { name: 'Till menyn' }).click()
  await expect(page.getByRole('button', { name: 'Hitta bokstaven' })).toBeVisible()
}

export function answerKey(choices: readonly string[], target: string): string {
  return String(choices.indexOf(target) + 1)
}
