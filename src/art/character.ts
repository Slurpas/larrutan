/**
 * The player character: 16×32 pixels (one tile wide, two tall), chibi proportions,
 * one default skin tone (PRD §9). Drawn facing down, up and to the right; left is
 * the right-hand frames mirrored. Colours are in ./palette.ts.
 *
 * Frames are stacked from parts: the head (rows 0–16), the body (17–23) and the
 * legs (24–31), so the walk frames only redraw the legs.
 */
export type Facing = 'down' | 'up' | 'side'

/** The row the soles of the feet are on; the character stands with this row on the ground. */
export const characterFeetRow = 28
export const characterSize = { width: 16, height: 32 } as const

const headDown = [
  '................',
  '................',
  '................',
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhjjjhhhhho..',
  '.ohhjjhhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhzhhhhzhhho.',
  '.ohzsssssssszho.',
  '.ohssssssssssho.',
  '.ohssossssossho.',
  '.ohssossssossho.',
  '.oscsssssssscso.',
  '.ossssszzssssso.',
  '..osssssssssso..',
  '...oooooooooo...',
]

const headUp = [
  '................',
  '................',
  '................',
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '.ohhhhjjhhhhhho.',
  '.ohhhjjhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.oshhhhhhhhhhso.',
  '.oshhhhhhhhhhso.',
  '..ozhhhhhhhhzo..',
  '...oooooooooo...',
]

const headSide = [
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '...oohhhhhhoo...',
  '..ohhhhjjjhhho..',
  '.ohhhhhjjhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhzssssho.',
  '.ohhhhhzsssssso.',
  '.ohhhhzssssssso.',
  '.ohhhhssssossso.',
  '.ohhhhssssossso.',
  '.ohhhzssssscsso.',
  '.ohhzssssssszso.',
  '..ohzssssssso...',
  '...oooooooooo...',
]

const bodyDown = [
  '...orrrrrrrro...',
  '..oprrrrrrrrRo..',
  '.oprrrrrrrrrrRo.',
  '.oprrrrrrrrrrRo.',
  '.osorrrrrrrRoso.',
  '..oobbbbbbbboo..',
  '...obbbbbbbbo...',
]

const bodyUp = [
  '...orrrrrrrro...',
  '..oRrrrrrrrrRo..',
  '.oRrrrrrrrrrrRo.',
  '.oRrrrrrrrrrrRo.',
  '.osorrrrrrrRoso.',
  '..oobbbbbbbboo..',
  '...obbbbbbbbo...',
]

const bodySide = [
  '....orrrrrro....',
  '...orrrrRRrro...',
  '...orrrrRRrRo...',
  '...orrrrRRrRo...',
  '...orrrrssrRo...',
  '...obbbbbbbbo...',
  '...obbbbbbBBo...',
]

// Legs: standing, then the two walking steps.
const legsFrontStand = [
  '...obbbBBbbbo...',
  '...obbboobbbo...',
  '...obbboobbbo...',
  '...okkkookkko...',
  '...oooo..oooo...',
  '................',
  '................',
  '................',
]

const legsFrontStepLeft = [
  '...obbbBBbbbo...',
  '...obbboobbbo...',
  '...obbbookkko...',
  '...okkkooooo....',
  '...oooo.........',
  '................',
  '................',
  '................',
]

const legsFrontStepRight = [
  '...obbbBBbbbo...',
  '...obbboobbbo...',
  '...okkkoobbbo...',
  '....oooookkko...',
  '.........oooo...',
  '................',
  '................',
  '................',
]

const legsSideStand = [
  '....obbbbbBo....',
  '....obbbbbBo....',
  '....obbbbbBo....',
  '....okkkkkkko...',
  '....ooooooooo...',
  '................',
  '................',
  '................',
]

const legsSideStep = [
  '....obbbbbbo....',
  '...obbboobbbo...',
  '..obbbo..obbbo..',
  '.okkkko..okkkko.',
  '.oooooo..oooooo.',
  '................',
  '................',
  '................',
]

const frame = (...parts: string[][]): readonly string[] => parts.flat()

/** Walk cycle per facing: standing, step, standing, step. The first frame is also the idle pose. */
export const characterFrames: Record<Facing, readonly (readonly string[])[]> = {
  down: [
    frame(headDown, bodyDown, legsFrontStand),
    frame(headDown, bodyDown, legsFrontStepLeft),
    frame(headDown, bodyDown, legsFrontStand),
    frame(headDown, bodyDown, legsFrontStepRight),
  ],
  up: [
    frame(headUp, bodyUp, legsFrontStand),
    frame(headUp, bodyUp, legsFrontStepRight),
    frame(headUp, bodyUp, legsFrontStand),
    frame(headUp, bodyUp, legsFrontStepLeft),
  ],
  side: [
    frame(headSide, bodySide, legsSideStand),
    frame(headSide, bodySide, legsSideStep),
    frame(headSide, bodySide, legsSideStand),
    frame(headSide, bodySide, legsSideStep),
  ],
}

/** The top of the head, in rows from the top: where a hat sits. */
export const characterHeadTop = 3
