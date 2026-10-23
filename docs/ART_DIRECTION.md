# Art direction

**Status: candidates ready, waiting for the user's pick (Task 8, PRD §9).** Nothing in the game has changed yet.

The same scene is drawn in three styles: the hub with paths, a pond, trees, the three signs and the character. Each is shown at iPad size (1080×810) and desktop size (1440×900), at the game's 64 CSS px per tile, with the real HUD on top.

All three are drawn entirely by code (`scripts/art-direction/candidates.html`, rendered by `node scripts/art-direction/render.mjs`). Nothing is downloaded.

| | Overview | iPad | Desktop | Close-up |
|---|---|---|---|---|
| All three | `art-direction/overview.png` | | | |
| A — Pixel art, 16×16 tiles | | `pixel16-ipad.png` | `pixel16-desktop.png` | `pixel16-details.png` |
| B — Pixel art, 32×32 tiles | | `pixel32-ipad.png` | `pixel32-desktop.png` | `pixel32-details.png` |
| C — Soft vector | | `vector-ipad.png` | `vector-desktop.png` | `vector-details.png` |

## The candidates

**A — Pixel art, 16×16 tiles** (the PRD's starting recommendation)
- **Look:** a chibi character of 16×32 pixels, shown at 4× (64 px per tile).
- **For:** the classic adventure-game look; very quick to make lots of consistent art by code; many CC0 packs at this size.
- **Against:** very little room for detail. A hat is about 10×4 pixels and a face is two dots, which matters for the wardrobe (Task 10). Its blocky look also differs from the smooth UI (buttons, cards, start screen).

**B — Pixel art, 32×32 tiles**
- **Look:** the same layout with four times the pixels, shown at 2×.
- **For:** room for faces, hair, clothes and readable items while staying pixel art. At game size it looks close to A, with finer detail.
- **Against:** about four times the drawing work per sprite and animation frame, and fewer CC0 packs match.

**C — Soft vector**
- **Look:** rounded shapes with the dark ink outline the UI already uses, soft shadows and smooth paths.
- **For:**
  - It matches the start screen, buttons and challenge cards, so the game looks like one thing.
  - Sharp at any size and screen density.
  - Items and clothes can be as detailed as needed.
  - Shapes are easy to recolour and layer (wardrobe).
- **Against:**
  - Less of a classic "game" feel.
  - Walk animation needs moving body parts rather than drawn frames, which is simple for this round character.
  - Fewer matching CC0 packs, so nearly everything is drawn by code.

**D — CC0 environment packs (not shown).** For example Kenney's "Tiny Town" (16×16, CC0). Showing them means downloading the files, which waits for the user's OK. They would be mixed with our own character in style A or B.

**Claude's recommendation: C**, with B as the choice if the user prefers pixel art.
- C fits the UI the child already uses.
- It gives the wardrobe room for detail.
- It is crisp on a retina iPad.

## Rules whatever the choice

- Letters and words are never drawn as pixels. They use a clear literacy font, Andika (SIL Open Font License), at screen resolution. Downloading the font waits for the user's OK; the candidates use the system's rounded font.
- 64 CSS px per tile on screen, as now. Pixel art at integer scale only.
- The character is about one tile wide and two tiles tall, chibi proportions, with one default skin tone (PRD §9).
- One fixed palette per style (in `candidates.html`), dark outlines, soft drop shadows under objects.
- Every asset is logged in `docs/ASSET_LICENSES.md`.

## After the pick (Task 9)

The chosen style's drawing code becomes the start of the real sprite pipeline:
- Sprites are drawn by code, then rendered to PNG atlases at build time (2× for retina in style C).
- The map is drawn from the text grid as today, but with real tiles.
- The character gets three walk directions.
- A contact sheet of every sprite is made for review.
