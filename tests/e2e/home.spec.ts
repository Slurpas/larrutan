import type { Page } from '@playwright/test'
import { hubMap } from '../../src/world/hubMap'
import { findPath } from '../../src/world/pathfinding'
import { houseAt, type HouseKind, type Tile } from '../../src/world/tileMap'
import { expect, test } from './fixtures'
import { enterMap, press } from './helpers'

// Walking to a house takes a few seconds.
test.slow()

/** The house of this kind on the hub map. */
function houseOf(kind: HouseKind) {
  for (const [row, kinds] of hubMap.kinds.entries()) {
    const col = kinds.indexOf(kind)
    if (col !== -1) return houseAt(hubMap, { col, row })!
  }
  throw new Error(`No ${kind} on the map`)
}

/**
 * Walks towards a house until its door is on screen, then taps the door, like a child
 * exploring: each tap is on a path tile on screen, a few steps along the way there.
 */
async function tapHouse(page: Page, kind: HouseKind, hasTouch: boolean) {
  const tap = (x: number, y: number) => (hasTouch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y))
  const pointOf = (tile: Tile) => page.evaluate((t) => window.__larrutanHub!.tilePoint(t), tile)
  const playerTile = () => page.evaluate(() => window.__larrutanHub!.playerTile())
  const viewport = page.viewportSize()!
  // Clear of the map's buttons in the top corners.
  const onScreen = (p: { x: number; y: number } | null): p is { x: number; y: number } =>
    p !== null && p.x > 120 && p.x < viewport.width - 120 && p.y > 140 && p.y < viewport.height - 80
  const house = houseOf(kind)
  for (let attempt = 0; attempt < 10; attempt++) {
    // Standing still, and the camera (which glides after the character) too.
    await expect.poll(() => page.evaluate(() => window.__larrutanHub!.isMoving())).toBe(false)
    await expect
      .poll(async () => {
        const a = await pointOf(house.door)
        await page.waitForTimeout(150)
        const b = await pointOf(house.door)
        return a !== null && b !== null && Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1
      })
      .toBe(true)
    const door = await pointOf(house.door)
    if (onScreen(door)) return tap(door.x, door.y)
    const from = await playerTile()
    const route = findPath(hubMap, from, [house.front]) ?? []
    let target: { x: number; y: number } | null = null
    for (const tile of route.slice(0, 6).reverse()) {
      const point = await pointOf(tile)
      if (onScreen(point)) {
        target = point
        break
      }
    }
    if (!target) throw new Error(`No step towards the ${kind} is on screen`)
    await tap(target.x, target.y)
    await expect.poll(async () => JSON.stringify(await playerTile()) !== JSON.stringify(from)).toBe(true)
  }
  throw new Error(`The ${kind} never came on screen`)
}

test('the blue house is home: inside, the wardrobe opens Mina saker, and the door leads out', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapHouse(page, 'blueHouse', hasTouch)
  const home = page.getByRole('main', { name: 'Hemma' })
  await expect(home).toBeVisible({ timeout: 15_000 })

  // The mirror: the child twirls round to show their back. Then the wardrobe: "Mina saker", and back into the room.
  await press(page.getByRole('button', { name: 'Spegeln' }), hasTouch)
  await press(page.getByRole('button', { name: 'Garderoben' }), hasTouch)
  await expect(page.getByRole('button', { name: /^Visa alla/ })).toBeVisible()
  await press(page.getByRole('button', { name: 'Tillbaka' }), hasTouch)
  await expect(home).toBeVisible()

  await press(page.getByRole('button', { name: 'Till kartan' }), hasTouch)
  await expect(home).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Till världen' })).toBeVisible()
})

test('at the red house nobody answers the knock', async ({ page, hasTouch }) => {
  await enterMap(page, hasTouch)
  await tapHouse(page, 'redHouse', hasTouch)
  await expect.poll(() => page.evaluate(() => window.__larrutanHub!.knocks()), { timeout: 15_000 }).toBe(1)
  await expect(page.getByRole('main', { name: 'Hemma' })).toHaveCount(0)
})
