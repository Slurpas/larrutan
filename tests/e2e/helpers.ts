import { expect, type Locator, type Page } from '@playwright/test'
import type { ChallengeId } from '../../src/challenges/challengeIds'
import type { Level } from '../../src/challenges/levels'
import { databaseName, profileStore } from '../../src/persistence/database'
import { toSaveFile } from '../../src/persistence/saveFile'
import { initialProgress } from '../../src/rewards/progress'
import { clipFileName } from '../../src/speech/clipName'
import { stopgapVoice } from '../../src/speech/voiceSettings'
import { townOf } from '../../src/world/places'
import type { Tile, TownId } from '../../src/world/tileMap'
import '../../src/world/hubTestApi'

/** Fixed seed: rounds are predictable, so tests know every answer. */
export const SEED = 4242

/** Taps on touch devices (the real iPad path, where speech must be unlocked inside the tap), clicks elsewhere. */
export function press(locator: Locator, hasTouch: boolean) {
  return hasTouch ? locator.tap() : locator.click()
}

/** Start screen → Spela → a town's map (?place skips the walk through the world), ready for input. */
export async function enterMap(page: Page, hasTouch: boolean, town: TownId = 'letters') {
  await page.goto(`/?seed=${SEED}&place=${town}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  const sign = (Object.keys(townOf) as ChallengeId[]).find((challenge) => townOf[challenge] === town)
  if (!sign) throw new Error(`No sign in the town of ${town}`)
  await page.waitForFunction((id) => window.__larrutanHub?.stationPoint(id) != null, sign)
}

/** A real tap (or click) on a sign in the game canvas: a challenge's, or on the world map a town's. */
export async function tapStation(page: Page, id: ChallengeId | TownId, hasTouch: boolean) {
  const point = await page.evaluate((sign) => window.__larrutanHub!.stationPoint(sign), id)
  if (!point) throw new Error(`No sign for ${id}`)
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
  await enterMap(page, hasTouch, townOf[challenge])
  await tapStation(page, challenge, hasTouch)
  await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeVisible()
}

/** Puts a save on the device. Open the game first (so its database exists), and again after, to load it. */
export function putSave(page: Page, save: unknown) {
  return page.evaluate(
    ({ name, store, save }) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open(name)
        open.onerror = () => reject(open.error)
        open.onsuccess = () => {
          const transaction = open.result.transaction(store, 'readwrite')
          transaction.objectStore(store).put(save, 'default')
          transaction.oncomplete = () => {
            open.result.close()
            resolve()
          }
        }
      }),
    { name: databaseName, store: profileStore, save },
  )
}

/**
 * Opens a challenge whose station is at `level`, for a child who has played nothing else.
 * `played`: the level of the last round there; a lower one means the station has just gone up.
 */
export async function startChallengeAt(page: Page, hasTouch: boolean, challenge: ChallengeId, level: Level, played: Level = level) {
  await enterMap(page, hasTouch, townOf[challenge])
  await putSave(page, toSaveFile({ ...initialProgress, stations: { [challenge]: { level, recent: [], played } } }, new Date()))
  await startChallenge(page, hasTouch, challenge)
  await expect(page.getByRole('img', { name: `Nivå ${level} av 4` })).toBeVisible()
}

/** Has the game played this sentence since the page was opened, in the voice or the free one standing in? (The silent fixture lists every clip.) */
export async function hasSaid(page: Page, text: string): Promise<boolean> {
  const clips = await page.evaluate(() => (window as unknown as { __playedClips?: string[] }).__playedClips ?? [])
  const names = [clipFileName(text), clipFileName(text, stopgapVoice)].map((file) => file.replace(/\.mp3$/, ''))
  return clips.some((clip) => names.some((name) => clip.includes(name)))
}

/** `timeout`: the mine cart takes a few seconds per question (riding in and through a tunnel). */
export async function waitForQuestion(page: Page, index: number, total: number, timeout?: number) {
  await expect(page.getByRole('img', { name: `Fråga ${index + 1} av ${total}` })).toBeVisible({ timeout })
}

export async function expectRoundCompleteThenMap(page: Page, timeout?: number) {
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeVisible({ timeout })
  await page.getByRole('button', { name: 'Till kartan' }).click()
  await expect(page.getByRole('heading', { name: 'Bra jobbat!' })).toBeHidden()
  // Back on the town's map, whose top-left button leads out to the world.
  await expect(page.getByRole('button', { name: 'Till världen' })).toBeVisible()
}

export function answerKey(choices: readonly string[], target: string): string {
  return String(choices.indexOf(target) + 1)
}
