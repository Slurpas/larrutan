// Renders every sprite in the game for review, with `npm run sprites`:
// - docs/sprites/contact-sheet.png: the character in every direction and walk frame, the station
//   signs with their letters and pictures, our own scenery, and the Kenney tiles in use (Task 9).
// - docs/sprites/wardrobe.png: every item, worn, seen from the front, the back and both sides (Task 10).
// - docs/sprites/pictures.png: every challenge picture on a card, with its word (Task 11).
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
const { composeCharacter, outfitSize } = await load('/src/art/outfit.ts')
const { items, rarityNames } = await load('/src/rewards/items.ts')
const { pictures } = await load('/src/art/pictures.ts')
const { words } = await load('/src/content/words.ts')
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

// The wardrobe: each item worn, front, back, right and left, in two walk frames for the front.
const wardrobe = items.map((item) => ({
  name: item.name,
  rarity: `${'★'.repeat(item.rarity)} ${rarityNames[item.rarity]}`,
  views: [
    ['down', 0],
    ['down', 1],
    ['up', 0],
    ['side', 1],
    ['left', 0],
  ].map(([facing, frame]) => composeCharacter(facing, frame, { [item.slot]: item.id })),
}))
const wardrobePng = await page.evaluate(
  ({ palette, wardrobe, size }) => {
    const scale = 3
    const cellW = size.width * scale + 8
    const cellH = size.height * scale + 8
    const perRow = 3
    const itemW = cellW * 5 + 20
    const itemH = cellH + 40
    const canvas = document.createElement('canvas')
    canvas.width = perRow * itemW + 20
    canvas.height = Math.ceil(wardrobe.length / perRow) * itemH + 60
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#eef3e8'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#3f2631'
    ctx.font = '600 24px system-ui'
    ctx.fillText('Lärrutan wardrobe: every item worn (front ×2 frames, back, right, left)', 20, 36)
    wardrobe.forEach((item, i) => {
      const x0 = 20 + (i % perRow) * itemW
      const y0 = 60 + Math.floor(i / perRow) * itemH
      ctx.fillStyle = '#3f2631'
      ctx.font = '600 16px system-ui'
      ctx.fillText(`${item.name}  ${item.rarity}`, x0, y0 + 16)
      item.views.forEach((grid, v) => {
        const x = x0 + v * cellW
        const y = y0 + 26
        ctx.fillStyle = '#84c669'
        ctx.fillRect(x, y, cellW - 4, cellH - 4)
        grid.forEach((row, r) =>
          [...row].forEach((c, col) => {
            if (c === '.') return
            ctx.fillStyle = palette[c]
            ctx.fillRect(x + 2 + col * scale, y + 2 + r * scale, scale, scale)
          }),
        )
      })
    })
    return canvas.toDataURL()
  },
  { palette, wardrobe, size: outfitSize },
)
writeFileSync('docs/sprites/wardrobe.png', Buffer.from(wardrobePng.split(',')[1], 'base64'))
console.log('docs/sprites/wardrobe.png')

// The challenge pictures, each on a white card about the size it has in the game.
const cards = words.map((word) => ({ word: word.base, letter: word.firstLetter, grid: pictures[word.id] }))
const picturesPng = await page.evaluate(
  ({ palette, cards }) => {
    const scale = 5
    const card = 32 * scale + 24
    const perRow = 7
    const cellW = card + 16
    const cellH = card + 40
    const canvas = document.createElement('canvas')
    canvas.width = perRow * cellW + 24
    canvas.height = Math.ceil(cards.length / perRow) * cellH + 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#cfe8fb'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#3f2631'
    ctx.font = '600 24px system-ui'
    ctx.fillText('Lärrutan challenge pictures: 32×32 pixels, shown at 5×', 24, 38)
    cards.forEach(({ word, grid }, i) => {
      const x = 24 + (i % perRow) * cellW
      const y = 60 + Math.floor(i / perRow) * cellH
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#2d4a6b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.roundRect(x, y, card, card, 22)
      ctx.fill()
      ctx.stroke()
      grid.forEach((row, r) =>
        [...row].forEach((c, col) => {
          if (c === '.') return
          ctx.fillStyle = palette[c]
          ctx.fillRect(x + 12 + col * scale, y + 12 + r * scale, scale, scale)
        }),
      )
      ctx.fillStyle = '#3f2631'
      ctx.font = '600 18px system-ui'
      ctx.fillText(word, x + 4, y + card + 26)
    })
    return canvas.toDataURL()
  },
  { palette, cards },
)
writeFileSync('docs/sprites/pictures.png', Buffer.from(picturesPng.split(',')[1], 'base64'))
console.log('docs/sprites/pictures.png')
await browser.close()
