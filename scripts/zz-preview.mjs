// TEMPORARY: renders a few sprites to a PNG for review. Deleted after use.
// Args: <out.png> <module path> <export name>[,<export name>…]
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const [out, modulePath, names] = process.argv.slice(2)
const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false } })
const { palette } = await server.ssrLoadModule('/src/art/palette.ts')
const module = await server.ssrLoadModule(modulePath)
await server.close()

const grids = []
for (const name of names.split(',')) {
  const value = module[name]
  if (Array.isArray(value)) grids.push([name, value])
  else for (const [key, grid] of Object.entries(value)) grids.push([`${name}.${key}`, grid])
}
const browser = await chromium.launch()
const page = await browser.newPage()
const png = await page.evaluate(
  ({ palette, grids }) => {
    const scale = 6
    const width = grids.reduce((w, [, g]) => w + g[0].length * scale + 30, 30)
    const height = Math.max(...grids.map(([, g]) => g.length * scale)) + 70
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#cfe8fb'
    ctx.fillRect(0, 0, width, height)
    let x0 = 30
    for (const [name, grid] of grids) {
      ctx.fillStyle = '#3f2631'
      ctx.font = '600 16px system-ui'
      ctx.fillText(name, x0, 24)
      grid.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (c === '.') return
          ctx.fillStyle = palette[c]
          ctx.fillRect(x0 + x * scale, 40 + y * scale, scale, scale)
        }),
      )
      x0 += grid[0].length * scale + 30
    }
    return canvas.toDataURL()
  },
  { palette, grids },
)
writeFileSync(out, Buffer.from(png.split(',')[1], 'base64'))
await browser.close()
console.log(out)
