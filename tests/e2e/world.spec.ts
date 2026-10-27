import type { Page } from '@playwright/test'
import { arrivalTile, places } from '../../src/world/places'
import type { Tile } from '../../src/world/tileMap'
import { expect, test } from './fixtures'
import { SEED, playerTile, press, tapStation } from './helpers'

const inTown = (page: Page) => page.getByRole('button', { name: 'Till världen' })
const inWorld = (page: Page) => page.getByRole('button', { name: 'Till start' })
/** A real tap (or click) on a map tile. */
async function tapTile(page: Page, tile: Tile, hasTouch: boolean) {
  const point = await page.evaluate((t) => window.__larrutanHub!.tilePoint(t), tile)
  if (!point) throw new Error('The map is not drawn yet')
  if (hasTouch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
}

test('the game starts in the world; a town\'s sign leads into its map, and "Till världen" comes back out outside it', async ({ page, hasTouch }) => {
  await page.goto(`/?seed=${SEED}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('letters') != null)
  await expect(inWorld(page)).toBeVisible()

  await tapStation(page, 'letters', hasTouch)
  await expect(inTown(page)).toBeVisible({ timeout: 15_000 })
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('findLetter') != null)

  await press(inTown(page), hasTouch)
  await expect(inWorld(page)).toBeVisible()
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('maths') != null)
  expect(await playerTile(page)).toEqual(arrivalTile('world', 'letters'))
})

test("tapping a house of the town of maths walks to that town's sign and goes in", async ({ page, hasTouch }) => {
  await page.goto(`/?seed=${SEED}`)
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('maths') != null)
  const world = places.world.map
  const house = world.kinds.flatMap((row, r) => row.flatMap((kind, c) => (kind === 'townHouseRed' && c > world.cols / 2 ? [{ col: c, row: r }] : [])))[4]!
  await tapTile(page, house, hasTouch)
  await expect(inTown(page)).toBeVisible({ timeout: 15_000 })
  // The town of maths has none of the town of letters' signs.
  expect(await page.evaluate(() => window.__larrutanHub!.stationPoint('findLetter'))).toBeNull()

  await press(inTown(page), hasTouch)
  await expect(inWorld(page)).toBeVisible()
  await page.waitForFunction(() => window.__larrutanHub?.stationPoint('maths') != null)
  expect(await playerTile(page)).toEqual(arrivalTile('world', 'maths'))
})
