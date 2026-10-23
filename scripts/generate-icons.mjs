// Renders scripts/app-icon.svg to the PNG icons the PWA manifest and iPad need.
// Uses Playwright's Chromium (already installed for the browser tests); no image libraries.
// Run with `npm run icons` after changing the SVG; the PNGs are committed.
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const svg = readFileSync('scripts/app-icon.svg', 'utf8')
// Maskable icons get cropped to a circle as small as 80% of the size, so the letter shrinks to fit.
const maskableSvg = svg.replace('<g id="letter"', '<g id="letter" transform="translate(256 264) scale(0.72) translate(-256 -264)"')

const icons = [
  { file: 'icon-192.png', size: 192, source: svg },
  { file: 'icon-512.png', size: 512, source: svg },
  { file: 'icon-maskable-512.png', size: 512, source: maskableSvg },
  // iPad home screen. Must be opaque; iPadOS adds the rounded corners.
  { file: 'apple-touch-icon.png', size: 180, source: svg },
]

mkdirSync('public/icons', { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const { file, size, source } of icons) {
  await page.setViewportSize({ width: size, height: size })
  const sized = source.replace('<svg ', `<svg width="${size}" height="${size}" `)
  await page.setContent(`<!doctype html><body style="margin:0">${sized}</body>`)
  await page.screenshot({ path: `public/icons/${file}`, clip: { x: 0, y: 0, width: size, height: size } })
  console.log(`public/icons/${file}`)
}
await browser.close()
