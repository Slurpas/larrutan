import type { Page } from '@playwright/test'
import { challengeNames, type ChallengeId } from '../../src/challenges/challengeIds'
import { hubMap } from '../../src/world/hubMap'
import { findPath } from '../../src/world/pathfinding'
import { banksOf, splashSpot, stationApproaches, type Tile } from '../../src/world/tileMap'
import { expect, test } from './fixtures'
import { enterMap, playerTile, press, tapStation } from './helpers'

const stationFor = (challenge: ChallengeId) => hubMap.stations.find((s) => 'challenge' in s && s.challenge === challenge)!

function arrowFor(from: Tile, to: Tile): string {
  if (to.col > from.col) return 'ArrowRight'
  if (to.col < from.col) return 'ArrowLeft'
  return to.row > from.row ? 'ArrowDown' : 'ArrowUp'
}

/** One arrow-key tap; waits until the character has arrived (or has had time to try). */
async function stepTo(page: Page, key: string, expected: Tile) {
  await page.keyboard.press(key)
  await expect.poll(() => playerTile(page)).toEqual(expected)
}

for (const challenge of ['findLetter', 'firstLetter', 'wordPicture', 'spelling', 'memory', 'sorting', 'baskets'] as const) {
  test(`tapping the ${challengeNames[challenge]} sign walks there, opens it, and closing returns to the same spot`, async ({
    page,
    hasTouch,
  }) => {
    await enterMap(page, hasTouch)
    await tapStation(page, challenge, hasTouch)
    await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeVisible()

    const spot = await playerTile(page)
    expect(stationApproaches(hubMap, stationFor(challenge))).toContainEqual(spot)

    await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
    await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeHidden()
    expect(await playerTile(page)).toEqual(spot)
  })
}

test('arrow keys walk to a sign and Enter opens it', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  const path = findPath(hubMap, hubMap.start, stationApproaches(hubMap, stationFor('wordPicture')))!

  let from = hubMap.start
  for (const tile of path) {
    await stepTo(page, arrowFor(from, tile), tile)
    from = tile
  }
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeVisible()
})

test('the character cannot walk through a tree', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  // Straight left from the start is a path, then grass, then a tree at column 3.
  const row = hubMap.start.row
  for (let col = hubMap.start.col - 1; col >= 4; col--) await stepTo(page, 'ArrowLeft', { col, row })

  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(400)
  expect(await playerTile(page)).toEqual({ col: 4, row })
})

test('nothing on the map moves while a challenge is open', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapStation(page, 'findLetter', hasTouch)
  await expect(page.getByRole('button', { name: 'Lyssna igen' })).toBeVisible()
  const spot = await playerTile(page)

  // Arrow keys belong to the challenge now, not the map.
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(400)
  expect(await playerTile(page)).toEqual(spot)
})

test('walking into the pond: the character falls in, splashes, and climbs back out where it jumped in', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  const splashes = () => page.evaluate(() => window.__larrutanHub!.splashes())
  const played = (sound: string) => page.evaluate((name) => (window as unknown as { __playedClips: string[] }).__playedClips.some((url) => url.includes(`/${name}.mp3`)), sound)
  // A tap in the middle of the pond: to its nearest edge, and in.
  const tapped = { col: 21, row: 16 }
  const water = splashSpot(hubMap, tapped)!
  const point = await page.evaluate((t) => window.__larrutanHub!.tilePoint(t), tapped)
  if (hasTouch) await page.touchscreen.tap(point!.x, point!.y)
  else await page.mouse.click(point!.x, point!.y)
  await expect.poll(splashes, { timeout: 15_000 }).toBe(1)
  const bank = await playerTile(page)
  expect(banksOf(hubMap, water)).toContainEqual(bank)
  await expect.poll(() => played('splash')).toBe(true)
  await expect.poll(() => played('pop')).toBe(true)
  // Out again, on the bank, and free to walk.
  await expect.poll(() => page.evaluate(() => window.__larrutanHub!.isMoving()), { timeout: 5_000 }).toBe(false)
  expect(await playerTile(page)).toEqual(bank)

  // Walking into the water with the arrow keys does it too.
  await page.keyboard.press(arrowFor(bank, water))
  await expect.poll(splashes).toBe(2)
  await expect.poll(() => page.evaluate(() => window.__larrutanHub!.isMoving()), { timeout: 5_000 }).toBe(false)
  expect(await playerTile(page)).toEqual(bank)
})
