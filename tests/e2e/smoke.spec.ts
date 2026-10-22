import { expect, test } from '@playwright/test'

test('start screen shows a large play button', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Lärrutan')
  await expect(page.getByRole('heading', { name: 'Lärrutan' })).toBeVisible()

  const playButton = page.getByRole('button', { name: 'Spela' })
  await expect(playButton).toBeVisible()

  // PRD §11: touch targets are at least about 64 px.
  const box = await playButton.boundingBox()
  expect(box?.height).toBeGreaterThanOrEqual(64)
})
