// Renders every sprite in the game into docs/sprites/contact-sheet.png for review (Task 9):
// the character in every direction and walk frame, the station signs with their letters and
// pictures, our own scenery, and the Kenney tiles in use. Run with `npm run sprites`.
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { createServer } from 'vite'

const server = await createServer({ appType: 'custom', logLevel: 'error', server: { middlewareMode: true, hmr: false } })
const load = (path) => server.ssrLoadModule(path)
const { palette } = await load('/src/art/palette.ts')
const { characterFrames } = await load('/src/art/character.ts')
const { stationSign, signPanel, sun, apple, mouse } = await load('/src/art/signs.ts')
const { rock, waterTile } = await load('/src/art/scenery.ts')
const { tinyTownHouses, tinyTownTiles } = await load('/src/art/kenney.ts')
await server.close()

// A small pond, to show water edges and corners together.
const pond = ['.~~~.', '~~~~~', '~~~~~', '.~~~.']
const isWater = (c, r) => pond[r]?.[c] === '~'
const pondTiles = pond.map((line, r) =>
  [...line].map((cell, c) =>
    cell === '~'
      ? waterTile(
          {
            up: !isWater(c, r - 1),
            down: !isWater(c, r + 1),
            left: !isWater(c - 1, r),
            right: !isWater(c + 1, r),
            upLeft: !isWater(c - 1, r - 1),
            upRight: !isWater(c + 1, r - 1),
            downLeft: !isWater(c - 1, r + 1),
            downRight: !isWater(c + 1, r + 1),
          },
          c + r,
        )
      : null,
  ),
)

const data = {
  palette,
  characterFrames,
  signs: [stationSign(false), stationSign(true)],
  signPanel,
  icons: { sun, apple, mouse },
  rock,
  pondTiles,
  kenneyTiles: tinyTownTiles,
  houses: tinyTownHouses,
  kenneySheet: `data:image/png;base64,${readFileSync('src/art/kenney/tiny-town.png').toString('base64')}`,
  font: `data:font/woff2;base64,${readFileSync('src/fonts/andika-700-latin.woff2').toString('base64')}`,
}

const browser = await chromium.launch()
const page = await browser.newPage()
const png = await page.evaluate(async (d) => {
  const font = new FontFace('Andika', `url(${d.font})`, { weight: '700' })
  await font.load()
  document.fonts.add(font)
  const sheet = new Image()
  sheet.src = d.kenneySheet
  await sheet.decode()

  const canvas = document.createElement('canvas')
  canvas.width = 1400
  canvas.height = 1230
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#eef3e8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const grass = (x, y, w, h) => {
    ctx.fillStyle = '#84c669'
    ctx.fillRect(x, y, w, h)
  }
  const label = (text, x, y, size = 18) => {
    ctx.fillStyle = '#3f2631'
    ctx.font = `600 ${size}px system-ui`
    ctx.fillText(text, x, y)
  }
  const drawGrid = (grid, x, y, scale, mirror = false) => {
    grid.forEach((row, j) =>
      [...row].forEach((c, i) => {
        if (c === '.') return
        ctx.fillStyle = d.palette[c]
        const col = mirror ? row.length - 1 - i : i
        ctx.fillRect(x + col * scale, y + j * scale, scale, scale)
      }),
    )
  }
  const kenneyTile = (index, x, y, scale) =>
    ctx.drawImage(sheet, (index % 12) * 16, Math.floor(index / 12) * 16, 16, 16, x, y, 16 * scale, 16 * scale)

  label('Lärrutan sprites: 16×16 pixel art (docs/ART_DIRECTION.md)', 24, 36, 24)

  // Character: each facing, four walk frames, at 6×.
  label('Character, 16×32, walk frames (standing, step, standing, step)', 24, 80)
  const facings = [['down', false], ['up', false], ['side', false], ['side', true]]
  facings.forEach(([facing, mirror], f) => {
    d.characterFrames[facing].forEach((frame, i) => {
      const x = 24 + i * 112 + (f % 2) * 470
      const y = 96 + Math.floor(f / 2) * 220
      grass(x - 4, y - 4, 104, 200)
      drawGrid(frame, x, y, 6, mirror)
    })
    label(mirror ? 'left (mirrored)' : facing, 24 + (f % 2) * 470, 96 + Math.floor(f / 2) * 220 + 212, 14)
  })

  // Signs with sample content, at 4×.
  label('Station signs (normal, and next to the child), with letters in Andika', 24, 560)
  const contents = [['AÖ'], ['sun', 'S'], ['apple', 'mouse']]
  contents.forEach((content, i) => {
    d.signs.forEach((sign, h) => {
      const x = 24 + i * 300 + h * 140
      const y = 576
      grass(x - 4, y - 4, 136, 136)
      drawGrid(sign, x, y, 4)
      const p = d.signPanel
      const px = x + p.x * 4
      const py = y + p.y * 4
      const pictures = content.filter((c) => d.icons[c])
      const text = content.filter((c) => !d.icons[c]).join('')
      let cursor = px + (pictures.length && text ? 6 : pictures.length === 2 ? 4 : 0)
      for (const name of pictures) {
        const icon = d.icons[name]
        drawGrid(icon, cursor, py + (p.height * 4 - icon.length * 4) / 2, 4)
        cursor += icon[0].length * 4 + 4
      }
      if (text) {
        ctx.fillStyle = '#3f2631'
        ctx.font = `700 ${p.height * 4 * 0.78}px Andika`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const left = pictures.length ? cursor : px
        ctx.fillText(text, (left + px + p.width * 4) / 2, py + (p.height * 4) / 2 + 2)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }
    })
  })

  // Our own scenery: water edges and corners, and a rock, at 4×.
  label('Our own: a pond and a rock', 24, 760)
  d.pondTiles.forEach((row, r) =>
    row.forEach((tile, c) => {
      const x = 24 + c * 64
      const y = 776 + r * 64
      grass(x, y, 64, 64)
      if (tile) drawGrid(tile, x, y, 4)
    }),
  )
  grass(380, 776, 64, 64)
  drawGrid(d.rock, 380, 776, 4)

  // Kenney tiles in use, at 4×: single tiles, tall trees (crown above trunk) and the houses.
  label("Kenney's Tiny Town tiles in use (CC0)", 600, 760)
  const singles = Object.entries(d.kenneyTiles).filter(([name]) => !/tallTree|autumnTree/.test(name))
  singles.forEach(([name, index], i) => {
    const x = 600 + (i % 4) * 200
    const y = 776 + Math.floor(i / 4) * 90
    grass(x, y, 64, 64)
    kenneyTile(index, x, y, 4)
    label(`${name} (${index})`, x + 72, y + 36, 14)
  })
  ;[['tallTreeTop', 'tallTreeTrunk'], ['autumnTreeTop', 'autumnTreeTrunk']].forEach(([top, trunk], i) => {
    const x = 24 + i * 80
    const y = 1060
    grass(x, y, 64, 128)
    kenneyTile(d.kenneyTiles[top], x, y, 4)
    kenneyTile(d.kenneyTiles[trunk], x, y + 64, 4)
  })
  label('tall trees', 24, 1210, 14)
  Object.entries(d.houses).forEach(([name, rows], i) => {
    const x = 600 + i * 230
    const y = 980
    rows.forEach((row, r) => row.forEach((index, c) => kenneyTile(index, x + c * 64, y + r * 64, 4)))
    label(name, x, y + 210, 14)
  })
  return canvas.toDataURL()
}, data)
mkdirSync('docs/sprites', { recursive: true })
const { writeFileSync } = await import('node:fs')
writeFileSync('docs/sprites/contact-sheet.png', Buffer.from(png.split(',')[1], 'base64'))
console.log('docs/sprites/contact-sheet.png')
await browser.close()
