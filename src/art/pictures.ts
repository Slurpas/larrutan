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
  // F
  fish: picture((p) => {
    // A blue fish swimming left: tail, fins, a lighter belly and a few scales.
    p.polygon([[21, 16], [30, 8.5], [27.5, 16], [30, 23.5]], 'u')
    p.polygon([[9, 10], [15, 4.5], [19, 10]], 'U')
    p.polygon([[12, 22], [16, 27], [18, 22]], 'U')
    p.ellipse(14, 16, 11, 7.5, 'u')
    p.shade('u', 'U', (x, y) => y >= 19 && x <= 22)
    for (const [x, y] of [[13, 13], [16, 15], [19, 13], [16, 11], [19, 17]] as const) p.set(x, y, 'U')
    p.outline('o')
    p.set(3, 17, 'o')
    eye(p, 7, 13)
  }),
  butterfly: picture((p) => {
    // Seen from above: two big wings, two small ones, a dark body and feelers.
    p.stroke([[15, 8], [11, 2.5]], 0.5, 'B')
    p.stroke([[17, 8], [21, 2.5]], 0.5, 'B')
    p.ellipse(9, 12, 7, 7.5, 'Y').ellipse(23, 12, 7, 7.5, 'Y')
    p.ellipse(10.5, 23, 5.5, 5.5, 'y').ellipse(21.5, 23, 5.5, 5.5, 'y')
    p.ellipse(8.5, 11.5, 3, 3.2, 'y').ellipse(23.5, 11.5, 3, 3.2, 'y')
    p.ellipse(10.5, 23.5, 2, 2, 'w').ellipse(21.5, 23.5, 2, 2, 'w')
    p.shade('Y', 'a', (x, y) => y <= 6 || x <= 3 || x >= 28)
    p.stroke([[16, 8], [16, 27]], 1.4, 'B')
    p.outline('o')
    p.set(11, 2, 'o').set(21, 2, 'o')
  }),
  foot: picture((p) => {
    // A bare foot from above, toes up: five toes, a wide front, an arch on the inside, a round heel.
    p.ellipse(17.5, 14.5, 9.5, 5.5, 's')
    p.ellipse(15.5, 25.5, 5.5, 4.5, 's')
    p.polygon([[8.5, 14], [27, 14], [21, 26], [10, 26]], 's')
    p.ellipse(7.5, 21, 3, 5.5, '.')
    // A pixel apart, so the outline draws a line between the toes.
    for (const [x, y, r] of [[10, 7.5, 2.6], [15.4, 6.2, 1.8], [19.8, 6.8, 1.6], [23.8, 8.3, 1.4], [27.4, 10.5, 1.2]] as const)
      p.ellipse(x, y, r, r * 1.15, 's')
    p.shade('s', 'z', (x, y) => y >= 13 && x >= 21.5 - (y - 13) * 0.3)
    p.outline('o')
    p.rect(9, 6, 2, 2, 'e').set(15, 5, 'e')
  }),
  sheep: picture((p) => {
    // A woolly white body, a dark face and legs.
    p.rect(10, 22, 3, 7, 'm').rect(21, 22, 3, 7, 'm')
    for (const [x, y] of [[11, 14], [17, 12], [23, 14], [25, 19], [19, 21], [12, 20]] as const) p.ellipse(x, y, 5, 5, 'w')
    p.ellipse(17, 17, 8, 5.5, 'w')
    p.shade('w', 'g', (x, y) => y >= 22 || (x >= 27 && y >= 17))
    p.ellipse(6.5, 15, 4, 5, 'm')
    p.polygon([[7, 10], [11.5, 9], [10, 12.5]], 'm')
    p.shade('m', 'n', (x, y) => x <= 5 && y <= 14)
    p.outline('o')
    p.rect(4, 13, 2, 2, 'w').set(4, 13, 'o')
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
  // N
  nose: picture((p) => {
    // A nose from the front: the bridge, the round tip and the two nostrils.
    p.polygon([[13.5, 3], [18.5, 3], [22, 19], [10, 19]], 's')
    p.ellipse(9.5, 22.5, 4.5, 4, 's').ellipse(22.5, 22.5, 4.5, 4, 's')
    p.ellipse(16, 20.5, 6, 5.5, 's')
    p.shade('s', 'z', (x, y) => x >= 19 || y >= 25)
    p.outline('o')
    p.ellipse(11.5, 24.5, 1.6, 1.1, 'o').ellipse(20.5, 24.5, 1.6, 1.1, 'o')
    p.rect(14, 17, 2, 2, 'e')
  }),
  key: picture((p) => {
    // A golden key: the ring to hold, the shaft and its teeth.
    p.fill(ring(9.5, 15.5, 7, 7, 3), 'y')
    p.rect(15, 14, 15, 4, 'y')
    p.rect(22, 18, 2, 4, 'y').rect(26, 18, 3, 6, 'y')
    p.shade('y', 'Y', (x, y) => y >= 17 && !(x < 16 && y < 19) || (x < 16 && Math.hypot(x + 0.5 - 9.5, y + 0.5 - 15.5) > 5 && x + y > 26))
    p.outline('o')
    p.set(5, 12, 'w').set(6, 11, 'w')
  }),
  teddy: picture((p) => {
    // A sitting teddy bear: round ears, a light muzzle and tummy.
    p.ellipse(9, 5.5, 3.5, 3.5, 'a').ellipse(23, 5.5, 3.5, 3.5, 'a')
    p.ellipse(7.5, 21, 3, 4.5, 'a').ellipse(24.5, 21, 3, 4.5, 'a')
    p.ellipse(10.5, 28, 4, 3, 'a').ellipse(21.5, 28, 4, 3, 'a')
    p.ellipse(16, 22.5, 8, 7, 'a')
    p.ellipse(16, 11.5, 8.5, 7.5, 'a')
    p.shade('a', 'j', (x, y) => x + y >= 42 || (y >= 29 && x >= 18))
    p.ellipse(9, 5.5, 1.6, 1.6, 'L').ellipse(23, 5.5, 1.6, 1.6, 'L')
    p.ellipse(16, 23.5, 4.5, 4.5, 'L').ellipse(16, 14.5, 3.8, 2.8, 'L')
    p.ellipse(10.5, 28.5, 2, 1.5, 'L').ellipse(21.5, 28.5, 2, 1.5, 'L')
    p.outline('o')
    eye(p, 12, 10)
    eye(p, 18, 10)
    p.rect(15, 13, 2, 1, 'h').set(16, 15, 'h')
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
  // R
  robot: picture((p) => {
    // A friendly grey robot: antenna, square eyes, a panel with buttons.
    p.stroke([[16, 3], [16, 6]], 0.6, 'n')
    p.rect(4, 19, 3, 8, 'n').rect(25, 19, 3, 8, 'n')
    p.rect(9, 6, 14, 10, 'g').rect(14, 16, 4, 2, 'n')
    p.rect(8, 18, 16, 11, 'g')
    p.rect(10, 29, 4, 2, 'n').rect(18, 29, 4, 2, 'n')
    p.shade('g', 'n', (x, y) => (x >= 21 && y <= 15) || (x >= 22 && y >= 18))
    for (const [x, y] of [[9, 6], [22, 6], [8, 18], [23, 18]] as const) p.set(x, y, '.')
    p.rect(11, 20, 10, 5, 'm')
    p.ellipse(16, 2.5, 1.6, 1.6, 'r')
    p.outline('o')
    p.rect(11, 9, 3, 3, 'u').rect(18, 9, 3, 3, 'u').set(11, 9, 'U').set(18, 9, 'U')
    p.rect(12, 13, 8, 1, 'm')
    p.set(13, 22, 'r').set(16, 22, 'y').set(19, 22, 'q')
  }),
  fox: picture((p) => {
    // A sitting fox seen from the side: pointed ears and snout, white chest, bushy tail with a white tip.
    p.stroke([[18, 26], [24.5, 24], [27, 18], [26, 11.5]], 3.4, 'Y')
    p.ellipse(25.5, 9.5, 3, 3, 'w')
    p.ellipse(16, 20.5, 7.5, 8.5, 'Y')
    p.rect(10, 25, 3, 5, 'Y').rect(15, 26, 3, 4, 'Y')
    p.polygon([[6, 7.5], [7.5, 1.5], [11, 6]], 'Y').polygon([[11, 6], [14.5, 1.5], [15.5, 8]], 'Y')
    p.ellipse(11, 11, 5.5, 5, 'Y')
    p.polygon([[7, 10], [1.5, 14], [8.5, 15.5]], 'Y')
    p.shade('Y', 'a', (x, y) => (x >= 20 && y >= 22) || (y >= 28 && x >= 15))
    p.ellipse(11.5, 20, 3.5, 5, 'w')
    p.polygon([[2.5, 14], [8.5, 15.5], [11, 13.5], [12, 16]], 'w')
    p.rect(10, 28, 3, 2, 'h').rect(15, 28, 3, 2, 'h')
    p.set(8, 4, 'h').set(13, 4, 'h')
    p.outline('o')
    p.rect(1, 13, 2, 2, 'o')
    eye(p, 9, 9)
  }),
  rocket: picture((p) => {
    // A white rocket with a red nose and fins, a round window and a flame.
    p.polygon([[13, 25], [16, 31], [19, 25]], 'Y')
    p.polygon([[14.5, 25], [16, 28.5], [17.5, 25]], 'y')
    p.polygon([[11, 15], [5.5, 24.5], [11, 22.5]], 'r').polygon([[21, 15], [26.5, 24.5], [21, 22.5]], 'r')
    p.fill((x, y) => y >= 3 && y <= 24 && Math.abs(x - 16) <= Math.min(5.5, 1.2 + (y - 3) * 0.9), 'w')
    p.shade('w', 'r', (_x, y) => y <= 8)
    p.shade('w', 'g', (x) => x >= 19)
    p.shade('r', 'R', (x) => x >= 19)
    p.rect(13, 24, 6, 2, 'n')
    p.outline('o')
    p.fill(ring(16, 14, 3.2, 3.2, 1), 'n')
    p.ellipse(16, 14, 2.2, 2.2, 'u')
    p.set(15, 13, 'U')
  }),
  rose: picture((p) => {
    // A red rose: the curled bloom, green sepals, a stem with two leaves.
    p.stroke([[16, 14], [16, 30]], 1, 'Q')
    /** A leaf: an ellipse along `angle`, centred at (cx, cy). */
    const leaf = (cx: number, cy: number, angle: number) => (x: number, y: number) => {
      const [dx, dy] = [x - cx, y - cy]
      const along = dx * Math.cos(angle) + dy * Math.sin(angle)
      const across = -dx * Math.sin(angle) + dy * Math.cos(angle)
      return (along / 5) ** 2 + (across / 2.2) ** 2 <= 1
    }
    p.fill(leaf(12, 21.5, 0.56), 'Q')
    p.fill(leaf(20.5, 24, -0.46), 'Q')
    p.shade('Q', 'G', (x, y) => (x <= 13 && y >= 22) || (x >= 20 && y >= 25))
    p.polygon([[10, 14], [16, 12], [22, 14], [16, 17]], 'G')
    p.ellipse(16, 9, 7.5, 6.5, 'r')
    p.shade('r', 'R', (x, y) => x + y >= 30 || y >= 13)
    const spiral: [number, number][] = []
    for (let t = 0; t <= 1.6; t += 0.05) spiral.push([16 + Math.cos(t * 2 * Math.PI) * (4.5 - t * 2.4), 8.5 + Math.sin(t * 2 * Math.PI) * (3.6 - t * 1.9)])
    p.stroke(spiral, 0.45, 'R')
    p.outline('o')
    p.set(11, 6, 'p').set(12, 5, 'p')
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
  // T
  train: picture((p) => {
    // A steam engine: cab, boiler, chimney with a puff of smoke, red and dark wheels.
    p.ellipse(25, 4, 3, 2.5, 'g').ellipse(29, 2.5, 2, 1.8, 'g')
    p.rect(22, 7, 5, 6, 'm').rect(21, 6, 7, 2, 'm')
    p.rect(3, 6, 10, 2, 'R')
    p.rect(4, 8, 8, 14, 'r')
    p.rect(12, 12, 17, 10, 'r')
    p.shade('r', 'R', (_x, y) => y >= 20)
    p.rect(6, 10, 4, 4, 'U')
    p.rect(2, 22, 28, 3, 'm')
    p.polygon([[29, 18], [31, 25], [29, 25]], 'm')
    p.ellipse(8, 25.5, 4.5, 4.5, 'B').ellipse(8, 25.5, 1.8, 1.8, 'g')
    p.ellipse(18, 26.5, 3.3, 3.3, 'B').ellipse(18, 26.5, 1.2, 1.2, 'g')
    p.ellipse(25, 26.5, 3.3, 3.3, 'B').ellipse(25, 26.5, 1.2, 1.2, 'g')
    p.rect(14, 14, 13, 1, 'p')
    p.outline('o')
  }),
  tooth: picture((p) => {
    // A white back tooth: a crown with two bumps, and two roots.
    p.ellipse(11.5, 9.5, 6, 6, 'w').ellipse(20.5, 9.5, 6, 6, 'w')
    p.rect(6, 9, 20, 10, 'w')
    p.polygon([[6, 17], [15, 17], [13, 29], [9.5, 29]], 'w')
    p.polygon([[17, 17], [26, 17], [22.5, 29], [19, 29]], 'w')
    p.shade('w', 'g', (x, y) => x >= 22 || (y >= 20 && x >= 13 && x <= 18) || y >= 27)
    p.set(15, 4, '.').set(16, 4, '.').set(16, 5, '.')
    p.outline('o')
    p.rect(9, 7, 2, 4, 'U')
  }),
  tomato: picture((p) => {
    // A red tomato, a bit wider than tall, with a green star of leaves on top.
    p.ellipse(16, 18.5, 13, 10.5, 'r')
    p.shade('r', 'R', (x, y) => ((x + 0.5 - 14) / 12.5) ** 2 + ((y + 0.5 - 16.5) / 10) ** 2 > 1)
    p.ellipse(9.5, 14.5, 2.5, 1.8, 'p')
    for (const [x, y] of [[8.5, 9], [12, 6.5], [20, 6.5], [23.5, 9]] as const) p.stroke([[16, 9], [x, y]], 1, 'Q')
    p.ellipse(16, 9, 2.5, 1.8, 'Q')
    p.stroke([[16, 8], [17, 3]], 0.8, 'G')
    p.outline('o')
  }),
  tiger: picture((p) => {
    // A tiger's face: orange with dark stripes, white cheeks, round ears.
    p.ellipse(7, 8, 4, 4, 'Y').ellipse(25, 8, 4, 4, 'Y')
    p.ellipse(16, 17.5, 12.5, 11.5, 'Y')
    p.shade('Y', 'a', (x, y) => x + y >= 41)
    p.ellipse(7, 8, 1.8, 1.8, 'e').ellipse(25, 8, 1.8, 1.8, 'e')
    p.ellipse(11.5, 23, 5, 4, 'w').ellipse(20.5, 23, 5, 4, 'w').ellipse(16, 26.5, 4, 2.5, 'w')
    for (const stripe of [
      [[16, 7], [16, 11]],
      [[12.5, 7.5], [13.5, 10.5]],
      [[19.5, 7.5], [18.5, 10.5]],
      [[4, 16], [8, 17]],
      [[4, 20], [7.5, 20]],
      [[28, 16], [24, 17]],
      [[28, 20], [24.5, 20]],
    ] as const)
      p.stroke(stripe, 0.6, 'o')
    p.polygon([[13.5, 19.5], [18.5, 19.5], [16, 22]], 'c')
    p.outline('o')
    p.rect(16, 22, 1, 2, 'o').rect(14, 24, 2, 1, 'o').rect(17, 24, 2, 1, 'o')
    eye(p, 9, 14)
    eye(p, 21, 14)
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
