import { Pixels } from './pixels'

/**
 * The challenge pictures (Första bokstaven, Ord och bild): one 32×32 pixel picture per
 * word, keyed by the word's id (src/content/words.ts). 32×32 rather than the map's
 * 16×16, so things like a hedgehog or an angel stay recognisable; on a card each art
 * pixel is about as big as on the map. Drawn from simple shapes, in the shared palette,
 * with the usual dark outline. No faces on things, only on animals and people.
 */
export const pictureSize = 32

function picture(draw: (p: Pixels) => void): readonly string[] {
  const p = new Pixels(pictureSize, pictureSize)
  draw(p)
  return p.toGrid()
}

/** A ring: inside the outer ellipse, outside the inner one. */
const ring =
  (cx: number, cy: number, rx: number, ry: number, thickness: number) =>
  (x: number, y: number): boolean =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && ((x - cx) / (rx - thickness)) ** 2 + ((y - cy) / (ry - thickness)) ** 2 > 1

const eye = (p: Pixels, x: number, y: number) => p.rect(x, y, 2, 2, 'o').set(x, y, 'w')

export const pictures: Readonly<Record<string, readonly string[]>> = {
  // A
  monkey: picture((p) => {
    p.ellipse(5.5, 16, 4, 4.5, 'j').ellipse(26.5, 16, 4, 4.5, 'j')
    p.ellipse(16, 15.5, 11, 11, 'j')
    p.rect(14, 3, 2, 2, 'j').rect(16, 2, 2, 3, 'j')
    p.shade('j', 'h', (x, y) => x + y >= 38)
    // The light face: two eye patches and a muzzle.
    p.ellipse(5.5, 16, 2.2, 2.7, 'e').ellipse(26.5, 16, 2.2, 2.7, 'e')
    p.ellipse(12.5, 13.5, 4.2, 4.6, 'e').ellipse(19.5, 13.5, 4.2, 4.6, 'e')
    p.ellipse(16, 20.5, 7.5, 5.5, 'e')
    p.shade('e', 'L', (_x, y) => y >= 24)
    eye(p, 11, 13)
    eye(p, 19, 13)
    p.set(14, 19, 'h').set(17, 19, 'h')
    p.rect(13, 22, 6, 1, 'h').set(12, 21, 'h').set(19, 21, 'h')
    p.outline('o')
  }),
  duck: picture((p) => {
    p.polygon([[22, 17], [30, 11], [29, 20]], 'y')
    p.ellipse(17, 21.5, 11.5, 7.5, 'y')
    p.ellipse(10.5, 11.5, 6.5, 6.5, 'y')
    p.shade('y', 'Y', (_x, y) => y >= 26)
    // The wing: a darker crescent on the body.
    p.ellipse(19, 21, 7, 4, 'Y').ellipse(18.5, 20, 6.2, 3.2, 'y')
    p.polygon([[1.5, 12], [5.5, 10.5], [5.5, 15], [2, 14.5]], 'Y')
    p.outline('o')
    eye(p, 9, 9)
  }),
  pineapple: picture((p) => {
    p.polygon([[16, 1], [18.5, 10], [13.5, 10]], 'G')
    p.polygon([[9, 3], [15, 10], [11.5, 11.5]], 'Q')
    p.polygon([[23, 3], [20.5, 11.5], [17, 10]], 'Q')
    p.polygon([[5, 8], [14, 12], [10, 13.5]], 'G')
    p.polygon([[27, 8], [22, 13.5], [18, 12]], 'G')
    p.ellipse(16, 21.5, 8.5, 9, 'y')
    p.shade('y', 'Y', (x, y) => y > 13 && ((x + y) % 5 === 0 || (x - y + 40) % 5 === 0))
    p.shade('y', 'e', (x, y) => x <= 12 && y <= 18)
    p.outline('o')
  }),
  orange: picture((p) => {
    p.ellipse(16, 18, 12.5, 12, 'Y')
    p.shade('Y', 'a', (x, y) => (x - 14) ** 2 + (y - 16) ** 2 > 135 && x + y > 36)
    p.ellipse(11, 12.5, 3, 2, 'y')
    for (const [x, y] of [[14, 21], [20, 16], [18, 25], [9, 20], [23, 22], [15, 15]] as const) p.set(x, y, 'a')
    p.rect(15, 3, 2, 4, 'D')
    p.polygon([[17, 5], [24, 1.5], [23.5, 6]], 'Q')
    p.outline('o')
  }),
  // I
  hedgehog: picture((p) => {
    // A back of spikes around the body, then the light face and snout.
    const [cx, cy] = [13, 21]
    for (let a = 170; a <= 360; a += 19) {
      const at = (deg: number, rx: number, ry: number) =>
        [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)] as const
      p.polygon([at(a - 10, 10, 7), at(a, 12, 12.5), at(a + 10, 10, 7)], 'h')
    }
    p.ellipse(cx, cy, 11, 7.5, 'h')
    p.shade('h', 'j', (x, y) => (x * 2 + y) % 5 === 0)
    p.ellipse(22.5, 23.5, 6, 5, 'e')
    p.polygon([[24, 20.5], [30, 24.5], [24, 28]], 'e')
    p.shade('e', 'L', (_x, y) => y >= 27)
    p.rect(8, 28, 3, 2, 'L').rect(17, 28, 3, 2, 'L')
    p.outline('o')
    p.rect(29, 23, 2, 2, 'o')
    eye(p, 23, 21)
  }),
  'ice-cube': picture((p) => {
    p.polygon([[4, 12], [11, 5], [28, 5], [21, 12]], 'w')
    p.polygon([[21, 12], [28, 5], [28, 22], [21, 29]], 'u')
    p.rect(4, 12, 17, 17, 'U')
    p.rect(6, 14, 2, 7, 'w').rect(6, 23, 2, 2, 'w')
    p.rect(23, 11, 2, 3, 'U')
    p.outline('o')
  }),
  // L
  lion: picture((p) => {
    p.fill((x, y) => {
      const r = 13 + Math.cos(Math.atan2(y - 16.5, x - 16) * 10) * 1.5
      return (x - 16) ** 2 + (y - 16.5) ** 2 <= r * r
    }, 'Y')
    p.shade('Y', 'a', (x, y) => x + y > 38)
    p.ellipse(9, 8.5, 3, 3, 'y').ellipse(23, 8.5, 3, 3, 'y')
    p.ellipse(16, 17.5, 8.5, 8, 'y')
    p.ellipse(16, 21.5, 4.5, 3, 'e')
    p.polygon([[13.5, 18.5], [18.5, 18.5], [16, 21.5]], 'h')
    p.rect(14, 23, 4, 1, 'h')
    p.outline('o')
    eye(p, 12, 15)
    eye(p, 18, 15)
  }),
  truck: picture((p) => {
    p.rect(2, 8, 18, 15, 'u').rect(2, 8, 18, 2, 'U')
    p.polygon([[20, 12], [26, 12], [30, 18], [30, 24], [20, 24]], 'r')
    p.shade('r', 'R', (_x, y) => y >= 22)
    p.polygon([[22, 14], [25.5, 14], [28, 18], [22, 18]], 'U')
    p.rect(2, 23, 28, 2, 'm')
    p.rect(29, 20, 1, 2, 'y')
    for (const x of [8, 24]) p.ellipse(x, 26, 3.5, 3.5, 'B').ellipse(x, 26, 1.5, 1.5, 'g')
    p.outline('o')
  }),
  lock: picture((p) => {
    p.fill((x, y) => y <= 14 && Math.hypot(x - 16, y - 12.5) <= 8 && Math.hypot(x - 16, y - 12.5) >= 5, 'n')
    p.shade('n', 'g', (x, y) => x < 14 && y < 10)
    p.rect(5, 15, 22, 15, 'y')
    p.shade('y', 'Y', (x, y) => y >= 27 || x >= 24)
    for (const [x, y] of [[5, 15], [26, 15], [5, 29], [26, 29]] as const) p.set(x, y, '.')
    p.ellipse(16, 20.5, 2, 2, 'o').rect(15, 21, 2, 5, 'o')
    p.outline('o')
  }),
  leaf: picture((p) => {
    const along = (x: number, y: number) => (x - 16 - (y - 16)) / Math.SQRT2
    const across = (x: number, y: number) => (x - 16 + (y - 16)) / Math.SQRT2
    p.stroke([[3, 29], [8, 24]], 0.9, 'D')
    p.fill((x, y) => Math.abs(along(x, y)) <= 13 && Math.abs(across(x, y)) <= 7.5 * (1 - (along(x, y) / 13) ** 2), 'q')
    p.shade('q', 'Q', (x, y) => across(x + 0.5, y + 0.5) > 0.5)
    p.stroke([[7, 25], [25, 7]], 0.5, 'G')
    for (const [ax, ay, bx, by] of [
      [12, 20, 10, 15],
      [16, 16, 14, 11],
      [20, 12, 19, 8],
      [12, 20, 17, 22],
      [16, 16, 21, 18],
      [20, 12, 24, 13],
    ] as const)
      p.stroke([[ax, ay], [bx, by]], 0.45, 'G')
    p.outline('o')
  }),
  // M
  mouse: picture((p) => {
    p.stroke([[25, 25], [29, 23], [30, 18], [28, 14.5]], 0.8, 'c')
    p.ellipse(18, 21.5, 9.5, 6.5, 'n')
    p.ellipse(9.5, 19, 6.5, 5.5, 'n')
    p.polygon([[2.5, 20], [9, 15], [9, 23.5]], 'n')
    p.shade('n', 'g', (x, y) => y <= 17 && x >= 13)
    p.ellipse(12.5, 11.5, 4.5, 4.5, 'n').ellipse(12.5, 11.5, 2.6, 2.6, 'c')
    p.rect(9, 27, 3, 2, 'c').rect(21, 27, 3, 2, 'c')
    p.outline('o')
    p.rect(2, 19, 2, 2, 'c')
    eye(p, 7, 17)
  }),
  moon: picture((p) => {
    p.fill((x, y) => Math.hypot(x - 15, y - 16) <= 12.5 && Math.hypot(x - 22, y - 11.5) > 10.5, 'y')
    p.shade('y', 'Y', (x, y) => Math.hypot(x + 0.5 - 22, y + 0.5 - 11.5) <= 12.3)
    p.set(8, 18, 'Y').set(9, 18, 'Y').set(10, 23, 'Y')
    p.outline('o')
  }),
  carrot: picture((p) => {
    p.stroke([[22, 10], [24.5, 2]], 1.4, 'Q')
    p.stroke([[22, 10], [30, 4.5]], 1.4, 'G')
    p.stroke([[22, 10], [29.5, 11.5]], 1.4, 'Q')
    const [ax, ay, bx, by] = [4, 28, 21.5, 10.5]
    const t = (x: number, y: number) =>
      Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
    const distance = (x: number, y: number) => Math.hypot(x - ax - t(x, y) * (bx - ax), y - ay - t(x, y) * (by - ay))
    p.fill((x, y) => distance(x, y) <= 0.8 + 5.4 * t(x, y), 'Y')
    p.shade('Y', 'y', (x, y) => x + 0.5 - ax + (y + 0.5 - ay) < -0.6 * (distance(x + 0.5, y + 0.5) + 6) && distance(x + 0.5, y + 0.5) > 1.5)
    for (const [cx, cy] of [[9, 23], [13, 19], [17, 15]] as const) p.stroke([[cx - 1, cy - 1], [cx + 1.5, cy + 1.5]], 0.45, 'a')
    p.outline('o')
  }),
  ant: picture((p) => {
    p.stroke([[13, 18], [9, 23], [7, 28]], 0.6, 'B')
    p.stroke([[15, 19], [15, 24], [13, 28.5]], 0.6, 'B')
    p.stroke([[16, 18], [20, 23], [22, 28]], 0.6, 'B')
    p.stroke([[6, 12], [4, 7.5], [1.5, 6]], 0.6, 'B')
    p.stroke([[8, 12], [9, 7], [7, 4]], 0.6, 'B')
    p.ellipse(7, 15, 4, 3.8, 'B')
    p.ellipse(14, 17.5, 3.5, 2.6, 'B')
    p.ellipse(23.5, 17.5, 6.5, 5.5, 'B')
    p.set(5, 13, 'b').set(13, 16, 'b').set(21, 14, 'b').set(22, 14, 'b').set(20, 15, 'b')
    p.outline('o')
    p.set(5, 14, 'w')
  }),
  // O
  snake: picture((p) => {
    p.stroke([[29, 28], [24, 28]], 1.3, 'q')
    p.stroke([[24, 28], [12, 28], [6, 24.5], [8, 19.5], [16, 17.5], [24, 15], [26, 10], [21, 6.5]], 2.6, 'q')
    p.ellipse(15.5, 6.5, 5, 4, 'q')
    p.shade('q', 'G', (x, y) => (x + y * 2) % 7 === 0)
    p.polygon([[10, 6.5], [6, 5], [7, 7], [6, 9]], 'r')
    p.outline('o')
    eye(p, 13, 4)
  }),
  cheese: picture((p) => {
    p.polygon([[2, 19], [24, 8], [30, 13]], 'e')
    p.polygon([[2, 19], [30, 13], [30, 23], [2, 28]], 'y')
    p.shade('y', 'Y', (_x, y) => y >= 26)
    p.ellipse(9, 23, 2.2, 2.2, 'Y').ellipse(18.5, 20, 2.6, 2.4, 'Y').ellipse(25.5, 20.5, 1.6, 1.6, 'Y')
    p.ellipse(19, 12.5, 1.6, 1, 'L')
    p.outline('o')
  }),
  // S
  sun: picture((p) => {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4
      p.stroke([[16 + Math.cos(a) * 10, 16 + Math.sin(a) * 10], [16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13]], 1.3, 'Y')
    }
    p.ellipse(16, 16, 8.5, 8.5, 'y')
    p.shade('y', 'Y', (x, y) => (x - 14) ** 2 + (y - 14) ** 2 > 64)
    p.ellipse(13, 12.5, 2, 1.5, 'e')
    p.outline('o')
  }),
  scissors: picture((p) => {
    p.stroke([[11, 22], [21, 3.5]], 1.6, 'g')
    p.stroke([[21, 22], [11, 3.5]], 1.6, 'n')
    p.fill(ring(9, 25, 5, 5, 2.4), 'r')
    p.fill(ring(23, 25, 5, 5, 2.4), 'r')
    p.shade('r', 'R', (_x, y) => y >= 27)
    p.ellipse(16, 13, 1.5, 1.5, 'm')
    p.outline('o')
  }),
  snail: picture((p) => {
    p.ellipse(16.5, 26.5, 13.5, 3.2, 'g')
    p.stroke([[5, 26], [5, 19]], 2.8, 'g')
    p.stroke([[4, 17], [2.5, 10.5]], 0.7, 'g')
    p.stroke([[6, 17], [8.5, 10.5]], 0.7, 'g')
    p.shade('g', 'n', (_x, y) => y >= 28)
    p.ellipse(18.5, 16.5, 9.5, 9, 'Y')
    p.shade('Y', 'a', (x, y) => (x - 16) ** 2 + (y - 14) ** 2 > 90 && x + y > 34)
    const spiral: [number, number][] = []
    for (let t = 0; t <= 2.2; t += 0.05) spiral.push([18.5 + Math.cos(t * 2 * Math.PI) * (7 - t * 2.7), 16.5 + Math.sin(t * 2 * Math.PI) * (6.6 - t * 2.6)])
    p.stroke(spiral, 0.5, 'D')
    p.outline('o')
    p.set(2, 10, 'o').set(8, 10, 'o')
    eye(p, 3, 20)
  }),
  shoe: picture((p) => {
    // A trainer: blue upper, white toe and sole, laces on top.
    p.polygon([[4, 11], [12, 11], [14, 15], [22, 16], [28, 19], [29.5, 23], [4, 23]], 'u')
    p.shade('u', 'U', (_x, y) => y <= 12)
    p.shade('u', 'w', (x, y) => x >= 25 && y >= 19)
    p.rect(3, 23, 27, 3, 'w').rect(3, 26, 27, 1, 'g')
    p.rect(4, 13, 2, 6, 'r')
    p.rect(8, 20, 14, 1, 'U')
    p.outline('o')
    for (const [x, y] of [[14, 16], [17, 17], [20, 18]] as const) p.rect(x, y, 2, 1, 'w')
  }),
  // Å
  eight: picture((p) => {
    p.fill(ring(16, 9.5, 6.5, 6.5, 3.3), 'u')
    p.fill(ring(16, 22, 8, 7.5, 3.5), 'u')
    p.shade('u', 'U', (x, y) => x <= 12 && (y <= 10 || (y >= 18 && y <= 24)))
    p.outline('o')
  }),
  thunder: picture((p) => {
    p.polygon([[18, 15], [12, 24], [16, 24], [13, 30], [22, 20], [17.5, 20], [21, 15]], 'y')
    p.stroke([[6, 22], [5, 25]], 0.7, 'u')
    p.stroke([[26, 21], [25, 24]], 0.7, 'u')
    p.stroke([[24, 26], [23, 29]], 0.7, 'u')
    p.ellipse(9, 13.5, 6, 5, 'n').ellipse(17, 9.5, 8, 7, 'n').ellipse(24, 13.5, 6, 5, 'n').rect(7, 12, 18, 6, 'n')
    p.shade('n', 'g', (x, y) => y <= 7 || (y <= 11 && (x <= 9 || x >= 22)))
    p.shade('n', 'm', (_x, y) => y >= 17)
    p.outline('o')
  }),
  // Ä
  apple: picture((p) => {
    p.ellipse(11.5, 18.5, 8.5, 10, 'r').ellipse(20.5, 18.5, 8.5, 10, 'r')
    p.shade('r', 'R', (x, y) => x + y >= 40 || y >= 27)
    p.ellipse(8.5, 15, 1.6, 2.8, 'p')
    p.set(8, 13, 'w')
    p.stroke([[16, 11], [17, 4]], 0.9, 'D')
    p.polygon([[18, 6.5], [25, 3], [23.5, 8]], 'Q')
    p.outline('o')
  }),
  egg: picture((p) => {
    p.fill((x, y) => {
      const v = (y - 17) / 13
      return Math.abs(v) <= 1 && Math.abs(x - 16) <= 9.5 * Math.sqrt(1 - v * v) * (1 + 0.15 * v)
    }, 'w')
    p.shade('w', 'g', (x, y) => ((x + 0.5 - 13) / 10) ** 2 + ((y + 0.5 - 14) / 13.5) ** 2 > 1)
    p.outline('o')
  }),
  angel: picture((p) => {
    p.ellipse(7, 18, 6, 7.5, 'w').ellipse(25, 18, 6, 7.5, 'w')
    p.shade('w', 'g', (x, y) => y >= 21 && (x < 9 || x > 22))
    p.polygon([[16, 14], [24, 30], [8, 30]], 'U')
    p.shade('U', 'u', (x, y) => y >= 28 || x >= 20)
    p.rect(10, 19, 3, 2, 's').rect(19, 19, 3, 2, 's')
    p.ellipse(16, 9.5, 5.5, 4, 'y')
    p.ellipse(16, 12, 4.2, 3.6, 's')
    p.fill(ring(16, 2.5, 6, 1.8, 1), 'y')
    p.outline('o')
    p.set(14, 12, 'o').set(18, 12, 'o').set(13, 14, 'c').set(19, 14, 'c')
  }),
  // Ö
  eye: picture((p) => {
    const lens = (x: number, y: number) => Math.hypot(x - 16, y - 28) <= 18 && Math.hypot(x - 16, y - 4) <= 18
    p.fill(lens, 'w')
    p.fill((x, y) => lens(x, y) && Math.hypot(x - 16, y - 16) <= 5.5, 'u')
    p.fill((x, y) => lens(x, y) && Math.hypot(x - 16, y - 16) <= 5.5 && y > 18, 'U')
    p.ellipse(16, 16, 2.5, 2.5, 'B')
    p.outline('o')
    p.rect(17, 13, 2, 2, 'w')
    for (const [ax, ay, bx, by] of [[7, 10.5, 5, 7], [11.5, 9, 10.5, 5], [16, 8.5, 16, 4.5], [20.5, 9, 21.5, 5], [25, 10.5, 27, 7]] as const)
      p.stroke([[ax, ay], [bx, by]], 0.55, 'o')
  }),
  ear: picture((p) => {
    // The outer rim, the lobe, and the curl inside, like a "?".
    p.ellipse(16, 13.5, 9, 11.5, 's').ellipse(14.5, 23.5, 5.5, 5.5, 's')
    p.shade('s', 'z', (x, y) => x + y >= 41)
    p.stroke([[11, 10], [13.5, 6.5], [18.5, 6], [21.5, 9.5], [21.5, 14], [18.5, 17.5], [17, 21]], 1.1, 'c')
    p.ellipse(16.5, 13, 2.2, 3, 'z')
    p.outline('o')
  }),
  island: picture((p) => {
    p.ellipse(16, 26.5, 14.5, 4.5, 'u')
    p.set(4, 27, 'U').set(5, 27, 'U').set(25, 28, 'U').set(26, 28, 'U').set(28, 25, 'U')
    p.ellipse(16, 25, 10, 3.8, 'e')
    p.shade('e', 'L', (_x, y) => y >= 27)
    p.stroke([[14, 25], [15.5, 18], [18, 12], [20, 9]], 1.2, 'd')
    p.shade('d', 'D', (_x, y) => y % 3 === 0)
    for (const tip of [[13, 6], [10, 9.5], [27, 4.5], [30, 9], [21.5, 2.5]] as const) p.stroke([[20, 8], tip], 1.5, 'Q')
    p.stroke([[20, 8], [13, 12]], 1.4, 'G')
    p.stroke([[20, 8], [27, 12]], 1.4, 'G')
    p.ellipse(19, 10, 1.3, 1.3, 'D').ellipse(21.5, 10.5, 1.3, 1.3, 'D')
    p.outline('o')
  }),
}
