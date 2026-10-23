import { phrases } from '../../src/content/phrases'
import { expect, test } from './fixtures'
import { press } from './helpers'

// Runs against a release build (see playwright.config.ts): the service worker only exists there.

test('the game can be installed: manifest, icons and app name', async ({ page, request }) => {
  await page.goto('./')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', './manifest.webmanifest')
  const manifest = (await (await request.get('./manifest.webmanifest')).json()) as {
    name: string
    display: string
    icons: { src: string; sizes: string; purpose?: string }[]
  }
  expect(manifest.name).toBe('Lärrutan')
  expect(manifest.display).toBe('standalone')
  const iconFiles = [...manifest.icons.map((icon) => icon.src), 'icons/apple-touch-icon.png']
  for (const file of iconFiles) {
    const response = await request.get(`./${file}`)
    expect(response.status(), file).toBe(200)
    expect(response.headers()['content-type'], file).toBe('image/png')
  }
  expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
})

test('after one visit the game starts, opens the map and speaks without a network', async ({ page, context, hasTouch }) => {
  await page.goto('./?debug=voices')
  // Wait until everything is stored and the service worker controls the page.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 30_000 })

  await context.setOffline(true)
  await page.reload()
  await press(page.getByRole('button', { name: 'Spela' }), hasTouch)
  // The map's game code (Phaser) is loaded separately; it must come from the cache too.
  await expect(page.locator('canvas')).toBeVisible()
  await expect(page.getByText(`clip finished: "${phrases.hubWelcome}"`)).toBeVisible({ timeout: 10_000 })
})
