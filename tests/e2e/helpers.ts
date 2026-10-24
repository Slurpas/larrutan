import { expect, type Locator, type Page } from '@playwright/test'
import type { ChallengeId } from '../../src/challenges/challengeIds'
import type { Tile } from '../../src/world/tileMap'
import '../../src/world/hubTestApi'

/** Fixed seed: rounds are predictable, so tests know every answer. */
export const SEED = 4242

/** Taps on touch devices (the real iPad path, where speech must be unlocked inside the tap), clicks elsewhere. */
export function press(locator: Locator, hasTouch: boolean) {
  return hasTouch ? locator.tap() : locator.click()
}

/** Start screen → Spela → the map, ready for input. */
export async function enterMap(page: Page, hasTouch: boolean) {
  await page.goto(`/?seed=${SEED}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('findLetter') != null)
}

/** A real tap (or click) on a station's sign in the game canvas. */
export async function tapStation(page: Page, challenge: ChallengeId, hasTouch: boolean) {
  const point = await page.evaluate((id) => window.__larrutanHub!.stationPoint(id), challenge)
  if (!point) throw new Error(`No station for ${challenge}`)
  if (hasTouch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
}

/** A real tap (or click) on the character on the map, which opens "Mina saker". */
export async function tapPlayer(page: Page, hasTouch: boolean) {
  const point = await page.evaluate(() => window.__larrutanHub!.playerPoint())
  if (!point) throw new Error('The character is not on screen yet')
  if (hasTouch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
}

export function playerTile(page: Page): Promise<Tile> {
  return page.evaluate(() => window.__larrutanHub!.playerTile())
}

/** Walks over the map to a challenge's sign and opens it. */
export async function startChallenge(page: Page, hasTouch: boolean, challenge: ChallengeId) {
  await enterMap(page, hasTouch)
  await tapStation(page, challenge, hasTouch)
  await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeVisible()
}

/** `timeout`: the mine cart takes a few seconds per question (riding in and through a tunnel). */
export async function waitForQuestion(page: Page, index: number, total: number, timeout?: number) {
  await expect(page.getByRole('img', { name: `Fråga ${index + 1} av ${total}` })).toBeVisible({ timeout })
}

export async function expectRoundCompleteThenMap(page: Page, timeout?: number) {
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible({ timeout })
  await page.getByRole('button', { name: 'Till kartan' }).click()
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Till start' })).toBeVisible()
}

export function answerKey(choices: readonly string[], target: string): string {
  return String(choices.indexOf(target) + 1)
}
