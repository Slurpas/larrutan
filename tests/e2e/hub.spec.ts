import type { Page } from '@playwright/test'
import { challengeNames, type ChallengeId } from '../../src/challenges/challengeIds'
import { hubMap } from '../../src/world/hubMap'
import { findPath } from '../../src/world/pathfinding'
import type { Mishap } from '../../src/world/mishaps'
import { banksOf, mishapSpot, stationApproaches, type Tile } from '../../src/world/tileMap'
import { expect, test } from './fixtures'
import { enterMap, playerTile, press, tapStation } from './helpers'

const stationFor = (challenge: ChallengeId) => hubMap.stations.find((s) => 'challenge' in s && s.challenge === challenge)!

function arrowFor(from: Tile, to: Tile): string {
  if (to.col > from.col) return 'ArrowRight'
  if (to.col < from.col) return 'ArrowLeft'
  return to.row > from.row ? 'ArrowDown' : 'ArrowUp'
}

const mishaps = (page: Page, mishap: Mishap) => page.evaluate((m) => window.__larrutanHub!.mishaps()[m], mishap)
const played = (page: Page, sound: string) =>
  page.evaluate((name) => (window as unknown as { __playedClips: string[] }).__playedClips.some((url) => url.includes(`/${name}.mp3`)), sound)
const standingStill = (page: Page) => expect.poll(() => page.evaluate(() => window.__larrutanHub!.isMoving()), { timeout: 5_000 }).toBe(false)

/** A real tap (or click) on a map tile; `x` and `y` say where in it, from 0 to 1 (the middle by default). */
async function tapTile(page: Page, tile: Tile, hasTouch: boolean, x = 0.5, y = 0.5) {
  const point = await page.evaluate((t) => window.__larrutanHub!.tilePoint(t), tile)
  const next = await page.evaluate((t) => window.__larrutanHub!.tilePoint(t), { col: tile.col + 1, row: tile.row + 1 })
  if (!point || !next) throw new Error(`Tile ${tile.col},${tile.row} is not on screen`)
  const at = { x: point.x + (x - 0.5) * (next.x - point.x), y: point.y + (y - 0.5) * (next.y - point.y) }
  if (hasTouch) await page.touchscreen.tap(at.x, at.y)
  else await page.mouse.click(at.x, at.y)
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

test('the character cannot walk through a tree: it bonks its head', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  // Straight left from the start is a path, then grass, then a tree at column 3.
  const row = hubMap.start.row
  for (let col = hubMap.start.col - 1; col >= 4; col--) await stepTo(page, 'ArrowLeft', { col, row })

  await page.keyboard.press('ArrowLeft')
  await expect.poll(() => mishaps(page, 'bonk')).toBe(1)
  await standingStill(page)
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
  // A tap in the middle of the pond: to its nearest edge, and in.
  const tapped = { col: 21, row: 16 }
  const water = mishapSpot(hubMap, tapped)!
  await tapTile(page, tapped, hasTouch)
  await expect.poll(() => mishaps(page, 'splash'), { timeout: 15_000 }).toBe(1)
  const bank = await playerTile(page)
  expect(banksOf(hubMap, water)).toContainEqual(bank)
  await expect.poll(() => played(page, 'splash')).toBe(true)
  await expect.poll(() => played(page, 'pop')).toBe(true)
  // Out again, on the bank, and free to walk.
  await standingStill(page)
  expect(await playerTile(page)).toEqual(bank)

  // Walking into the water with the arrow keys does it too.
  await page.keyboard.press(arrowFor(bank, water))
  await expect.poll(() => mishaps(page, 'splash')).toBe(2)
  await standingStill(page)
  expect(await playerTile(page)).toEqual(bank)
})

test('tapping a tree, even its leafy top: the character walks into it, bonks its head and sees stars, then stands where it was', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  const tree = { col: 22, row: 9 }
  expect(hubMap.kinds[tree.row]![tree.col]).toBe('tallTree')
  // The crown hangs over the tile above the trunk, where a child taps "the tree".
  await tapTile(page, { col: tree.col, row: tree.row - 1 }, hasTouch)
  await expect.poll(() => mishaps(page, 'bonk'), { timeout: 15_000 }).toBe(1)
  const spot = await playerTile(page)
  expect(banksOf(hubMap, tree)).toContainEqual(spot)
  await expect.poll(() => played(page, 'bonk')).toBe(true)
  await standingStill(page)
  expect(await playerTile(page)).toEqual(spot)
  expect(await mishaps(page, 'splash')).toBe(0)
})

test('walking over a rock: the character trips, falls flat and gets up again', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  const rock = { col: 24, row: 13 }
  expect(hubMap.kinds[rock.row]![rock.col]).toBe('rock')
  const path = findPath(hubMap, hubMap.start, banksOf(hubMap, rock))!
  let from = hubMap.start
  for (const tile of path) {
    await stepTo(page, arrowFor(from, tile), tile)
    from = tile
  }
  await page.keyboard.press(arrowFor(from, rock))
  await expect.poll(() => mishaps(page, 'trip')).toBe(1)
  await expect.poll(() => played(page, 'thud')).toBe(true)
  await standingStill(page)
  expect(await playerTile(page)).toEqual(from)
})

test.describe('on a phone, where the tiles are small', () => {
  // An iPhone 13 in landscape, as Safari shows it: 32 px tiles.
  test.use({ viewport: { width: 750, height: 342 } })

  test('a tap just beside a rock still counts: the character trips over it', async ({ page, hasTouch }) => {
    await enterMap(page, hasTouch)
    const rock = { col: 24, row: 13 }
    expect(hubMap.kinds[rock.row]![rock.col]).toBe('rock')
    // Just above the rock's tile, the way a finger lands on something this small.
    await tapTile(page, { col: rock.col, row: rock.row - 1 }, hasTouch, 0.5, 0.85)
    await expect.poll(() => mishaps(page, 'trip'), { timeout: 15_000 }).toBe(1)
    expect(banksOf(hubMap, rock)).toContainEqual(await playerTile(page))
  })
})
