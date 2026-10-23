# Art direction

**Decided 2026-10-23: 16×16 pixel art** (candidate A), with the soft, rounded UI kept for buttons and cards.

**Why** (the user's criterion was where Claude will actually produce the most clothes, items and options, not what is possible in theory):
- Every sprite is a small grid drawn by code, so many items can be made quickly and stay consistent.
- Colour variants are palette swaps, and walk frames are tiny.
- Large free CC0 pixel libraries exist for scenery.
- Children aged 6–8 know and like the look (Minecraft, Pokémon).
- **Trade-off:** clothes are small on the map, about like a Minecraft skin. "Mina saker" shows the character large.

The candidates that were compared (`docs/art-direction/`: overview, iPad, desktop and close-up for each) are kept as a record:
- **A:** pixel art, 16×16 tiles. Chosen.
- **B:** pixel art, 32×32 tiles.
- **C:** soft vector.

## Rules

- **Sizes:** tiles are 16×16 pixels, shown at 4× (64 CSS px per tile, as `src/world/camera.ts` already uses). Scaling is always by whole numbers, with nearest-neighbour sampling (no smoothing).
- **The character:** 16×32 pixels (one tile wide, two tall), chibi proportions, one default skin tone (PRD §9).
- **Directions:** down, up and side are drawn; the other side is mirrored.
- **Outlines:** a 1-pixel dark outline (Kenney's `#3f2631`) around characters, objects and signs. Ground tiles have no outline.
- **Light:** comes from the top left. Each colour has a light and a dark shade, and there are soft shadows under objects.
- **Letters and words are never pixels.** They use a clear literacy font at screen resolution: Andika (SIL Open Font License).
- **The UI stays as it is:** round buttons, cards with the dark ink outline. Pixel art is for the world, the character and the items.
- **Licences:** every asset is logged in `docs/ASSET_LICENSES.md`. CC0 packs only, and only after the user's OK to download.

## Palette

One fixed palette: the 33 colours of Kenney's Tiny Town, so our own sprites match its scenery. The colours we use are in `src/art/palette.ts`, one character per colour for the text-grid sprites. Examples:
- outline `#3f2631`
- grass `#84c669`
- skin `#fcbc8f`
- shirt `#e84537`
- water `#009adc` and `#76e4ff`
- wood `#bd6c4a`

More colours are only added from the same 33.

## What comes from where (Task 9)

- **Kenney's Tiny Town** (CC0, `src/art/kenney/`, chosen tiles in `src/art/kenney.ts`):
  - grass, grass with tufts or flowers, the stone path;
  - small, round and tall trees (green and autumn), mushrooms;
  - the blue and red houses (3×3 tiles each).
- **Drawn by Claude** (`src/art/`):
  - the character (16×32, walking down, up and to the side, mirrored for left), as hand-made text grids;
  - the station signs with their sun, apple and mouse pictures;
  - the pond's water, banks and corners, and the rock, drawn by a tiny pixel helper (`pixels.ts`).
- **Letters:** Andika (SIL OFL, `src/fonts/`), on the signs and on the challenge cards.

## How it is built

- **Sprites:** text grids in TypeScript, one palette character per pixel and `.` for transparent. Unit tests check that every row has the same width and every colour is in the palette.
- **The map:** the game turns the grids into Phaser textures when it starts (`src/world/textures.ts`); there is no build step.
- **Rules:** `src/world/groundTiles.ts` decides, tile by tile, how the map is drawn, and is tested.
- **Display:** Phaser runs in pixel-art mode at a whole-number zoom.
- **Outside the map:** "Mina saker" draws the same character as crisp SVG (`src/ui/PixelSprite.tsx`).
- **Review:** `npm run sprites` renders every sprite into `docs/sprites/contact-sheet.png`, and every wardrobe item worn from the front, back and both sides into `docs/sprites/wardrobe.png`.

## The wardrobe (Task 10)

- **One renderer:** `composeCharacter` (`src/art/outfit.ts`) draws the character on a 26×40 canvas: the 16×32 body plus room for tall hats, wings and balloons. The map, "Mina saker" and the reward screen all use it.
- **Clothes that cover the body** (tops, trousers) are recolours: the body's shirt colours (`r`, `R`, `p`) or trouser colours (`b`, `B`) are repainted, row by row for stripes, with optional dots for stars. Every pixel is judged on the bare body, so a sweater's new colour is never repainted by the trousers.
- **Things put on or held** (hats, capes, backpacks, wings, the flower, balloon and wand) are small grids with a position per facing (down, up, side; left is mirrored). Each can be drawn behind the body (a cape from the front) or in front of it (a backpack from behind).
- **Adding an item:** a data entry in `src/rewards/items.ts` plus its art in `src/art/wardrobe.ts`. `src/art/outfit.test.ts` fails if either is missing, if art uses a colour outside the palette, or if it reaches outside the canvas.

## Still to do

- **Pictures in the challenges are still emoji** until the picture cards (Task 11).
