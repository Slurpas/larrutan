import { expect, test, type Page } from '@playwright/test'
import { challengeNames, type ChallengeId } from '../../src/challenges/challengeIds'
import { hubMap } from '../../src/world/hubMap'
import { findPath } from '../../src/world/pathfinding'
import { stationApproaches, type Tile } from '../../src/world/tileMap'
import { enterMap, playerTile, press, tapStation } from './helpers'

const stationFor = (challenge: ChallengeId) => hubMap.stations.find((s) => s.challenge === challenge)!

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

for (const challenge of ['findLetter', 'firstLetter', 'wordPicture'] as const) {
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
