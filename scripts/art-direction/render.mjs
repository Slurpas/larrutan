// Renders the art direction candidates (candidates.html) to PNGs in docs/art-direction/:
// each style at iPad and desktop size, a close-up sheet, and an overview of all three.
// Run: node scripts/art-direction/render.mjs
import { mkdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = 'docs/art-direction'
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto(pathToFileURL('scripts/art-direction/candidates.html').href)
await page.waitForFunction(() => window.ready === true)

async function save(file, make, arg) {
  const dataUrl = await page.evaluate(make, arg)
  const { writeFileSync } = await import('node:fs')
  writeFileSync(`${out}/${file}`, Buffer.from(dataUrl.split(',')[1], 'base64'))
  console.log(`${out}/${file}`)
}

for (const style of ['pixel16', 'pixel32', 'vector']) {
  // iPad (10.2", landscape, CSS pixels) and a common laptop size.
  await save(`${style}-ipad.png`, (s) => window.candidates.view(s, 1080, 810).toDataURL(), style)
  await save(`${style}-desktop.png`, (s) => window.candidates.view(s, 1440, 900).toDataURL(), style)
  await save(`${style}-details.png`, (s) => window.candidates.details(s).toDataURL(), style)
}

await save('overview.png', () => {
  const names = { pixel16: 'A — Pixel art, 16×16 tiles', pixel32: 'B — Pixel art, 32×32 tiles', vector: 'C — Soft vector' }
  const canvas = document.createElement('canvas')
  canvas.width = 3 * 540 + 4 * 16
  canvas.height = 405 + 70
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#1d2330'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  window.candidates.styles.forEach((style, i) => {
    const x = 16 + i * (540 + 16)
    ctx.drawImage(window.candidates.view(style, 1080, 810), x, 54, 540, 405)
    ctx.fillStyle = '#ffffff'
    ctx.font = '600 22px system-ui'
    ctx.fillText(names[style], x, 36)
  })
  return canvas.toDataURL()
})
await browser.close()
