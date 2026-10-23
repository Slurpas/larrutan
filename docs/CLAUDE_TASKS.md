# Lärrutan — Task plan

General working rules are in `/CLAUDE.md`, which Claude Code loads every session. Requirements are in `docs/PRD.md`.

How a task runs:
1. Claude does one task, then stops for review. It never continues into the next task automatically.
2. Claude reports what changed, how it was tested, screenshots, known limitations, and a short **Check on the iPad** list.
3. The user approves, asks for changes, or reorders the plan.

---

## Phase 1 — Playable prototype

Goal: a child can play three real literacy challenges on an iPad and walk between them. No saving, no art pipeline, placeholder graphics only.

### Task 1 — Project setup

**Goal:** a working, empty app the user can open on their iPad.

**Work**
1. `git init` and `.gitignore`.
2. Vite + React + TypeScript app named `larrutan`.
3. Vitest, ESLint, and one Playwright smoke test (Chromium and WebKit).
4. npm scripts: `dev`, `build`, `test`, `lint`, `typecheck`.
5. Dev server reachable from the iPad on the local network, with instructions in the README (including the Windows firewall prompt).
6. iPad basics: viewport settings, no double-tap or pinch zoom, no text selection, landscape layout.
7. A placeholder start screen with a big "Spela" button.
8. Fill in the Commands section of `CLAUDE.md`; a short README.

**Not in this task:** Phaser, saving, PWA, game content.

**Acceptance**
- `dev`, `build`, `test`, `lint` and `typecheck` all succeed.
- The start screen opens on desktop and on the user's iPad.
- The first commit is made.

**Check on the iPad:** open the link.

### Task 2 — First challenge: Hitta bokstaven

**Goal:** the first real learning challenge, playable end to end.

**Work**
1. Speech module using the browser's Swedish voice (Web Speech API): pick the best available sv-SE voice, start audio on the first tap, a replay button, and a visible warning if no Swedish voice exists.
2. Typed content file: about 8 upper-case letters including Å, Ä and Ö, each with displayed text and spoken text, plus a look-alike table (A/Å/Ä, O/Ö …).
3. Challenge engine: a seeded round of 5 questions with 3 choices; look-alikes are never mixed at the easy level; every question is validated before display.
4. Screen: spoken question "Var är …?", big letter buttons, speaker button, exit button.
5. Feedback: spoken and visual praise when correct. When wrong: say and show the right letter, remove one wrong option, allow retry.
6. End of round: a simple celebration, then back to the start screen.
7. Touch, mouse and keyboard (Tab/arrows + Enter, number keys).

**Acceptance**
- A round can be completed with touch and with keyboard.
- Every question has exactly one correct answer, and distractors are valid and distinct (tested).
- The same seed gives the same round (tested).
- Å, Ä and Ö display, speak and compare correctly (tested).
- No timers anywhere.

**Check on the iPad:** play a round with sound on; let the child try; note any letter that sounds wrong.

### Task 3 — Första bokstaven and Ord och bild

**Goal:** three challenge types sharing the same building blocks.

**Work**
1. Word list of 20–30 picturable words with emoji placeholders, each with first letter, first-sound note and approval status. Only simple-case words (first letter = first sound). Avoid very new emoji. Present the list to the user as a table for approval before using it.
2. **Första bokstaven:** show the picture, say the word, choose the first letter.
3. **Ord och bild:** say "Var är …?", choose among pictures.
4. Share code between challenges (round flow, feedback, speaker button) only where all three actually use it.
5. Content validation test: references exist, no ambiguous distractors (e.g. two pictures starting with the same letter in Första bokstaven), no excluded tricky words.
6. A simple menu to pick a challenge, temporary until the hub exists.

**Acceptance**
- All three challenges are playable by touch and keyboard.
- Content validation runs in the tests and fails on a broken entry.
- The user has approved the word list.

**Check on the iPad:** approve the word table; play all three challenges; check every emoji shows up; with the child, check each picture is named correctly ("Vad är det här?").

### Task 4 — Hub world

**Goal:** walking between challenges makes it feel like a game.

**Work**
1. Add Phaser for the world scene only; the challenges stay in React.
2. One small map from a text grid: grass, paths, a few obstacles, and three stations (placeholder shapes or emoji with clear outlines).
3. A placeholder character (a simple shape with a face) and a following camera that stays inside the map.
4. Tap/click to move with simple pathfinding around obstacles; tapping a station walks there and opens it.
5. Keyboard movement (arrows/WASD), Enter/Space at a station.
6. Leaving a challenge returns the child to the same spot on the map.

**Acceptance**
- The character can't walk through obstacles, and the camera never shows space outside the map.
- Every station is reachable and opens its challenge with touch and with keyboard.
- The map layout is data, not code.

**Check on the iPad:** walk around; see whether the child finds and opens the stations without help.

### Task 5 — Rewards within a session

**Goal:** a reason to keep playing, following the reward rules in PRD §10.

**Work**
1. Reward rules in one config file: XP per completed round; first completion of a level gives full XP; replays give reduced XP (start at about 25%); nothing per click or retry.
2. Exactly-once grants for milestones and unlocks (a small in-memory reward ledger).
3. XP bar and a level-up celebration (visual and spoken).
4. Easy and harder levels for at least one challenge, so "first completion" means something.
5. 3–5 placeholder items (emoji hats and similar) with rarity stars; unlocked items can be worn by the placeholder character.
6. A simple "Mina saker" view: unlocked items, and locked items with stars and a spoken hint about how to earn them.

**Acceptance**
- Tests: replays give less XP than first completions; retrying answers gives nothing; duplicated completion events never grant twice; hints don't reduce rewards.
- The character wears the equipped item on the map.
- Progress resets on reload, by design, and this is documented. (Saving arrived in Task 7.)

**Check on the iPad:** play through and try to farm XP; with the child, see whether rewards make them want to replay.

### Phase 1 checkpoint — playtest

The user watches a child play for 15–30 minutes and notes where they got stuck, what they didn't understand, what they liked, and which words or pictures were wrong. Claude turns the notes into fixes and adjusts Phase 2 before starting it.

---

## Phase 2 — First real game

Ordered by impact. Full Work and Acceptance sections are written when the phase starts, based on what the playtest shows.

### Task 6 — Generated voice
Partly done early (2026-10-22), because Brave on Windows has no Swedish voice: `npm run speech` generates every sentence with Piper, the files are committed, the game plays them, and a test fails on missing clips.

Done 2026-10-23:
- **Review page** (`?review=voices` on the dev server): play, approve or reject each clip with a note.
- **Saving:** decisions go to `src/speech/audio/sv/approvals.json`.
- **File names:** a clip's name includes its pronunciation and voice, so a regenerated clip is unreviewed again and can't play from a stale cache.
- **Status:** `npm run speech` reports the review status.
- **Clean-up:** eight old spoken-praise clips that were still bundled were deleted.

Remaining:
- **Engine comparison:**
  - Azure and Google need a credit card, so they are out.
  - Gemini TTS (free tier, no card, 10 requests a day) was sampled. The user picks by ear: Alma, or a Gemini voice.
  - The user creates any account and puts the key in a local `.env`.
- **The review itself:** the user goes through all clips, and Claude fixes the rejected ones.
- **Release builds contain only approved clips:** enforced at the release review, once all clips are approved.

### Task 7 — Saving and iPad install

**Goal:** progress survives, and the game installs on the iPad home screen and plays offline (PRD §12).

**Work**
1. Versioned local saving in IndexedDB (`src/persistence`). The first upgrade step comes with the first change to the saved shape.
2. Recovery from broken saves:
   - Each field is checked and reset on its own.
   - The broken save is kept as a backup.
   - Nothing is written before a successful read.
   - A newer save is never overwritten.
3. PWA:
   - Manifest and app icon (`npm run icons`).
   - iPad home-screen tags.
   - A service worker that caches every file, with range responses for Safari audio.
   - Persistent storage, requested in the installed app only.
4. Phaser loads lazily: the first download went from 471 KB to 113 KB gzipped, and Phaser's 360 KB loads while the start screen shows.
5. Free static HTTPS hosting: GitHub Pages (chosen 2026-10-23), https://slurpas.github.io/larrutan/, deployed by GitHub Actions on every push to `main`. The repository is public; commits use the GitHub no-reply address.

**Acceptance**
- Unit tests: save round trip, empty, junk, per-field repair, unknown items and levels, newer versions.
- Browser tests: progress survives a reload; a broken save is repaired and backed up.
- Offline tests against a release build (Chromium and WebKit): the manifest and icons are served; after one visit, the game starts, opens the map and speaks with the network off.
- Release builds show the build time on the start screen.

### Task 8 — Art direction
- Side-by-side comparison of candidate styles (tile resolutions, own vs CC0 environment) at iPad and desktop size; the user picks.
- `docs/ART_DIRECTION.md`, `docs/ASSET_LICENSES.md`, the palette, and the Andika font for letters.

Status 2026-10-23:
- **Decided: 16×16 pixel art.** Compared against pixel 32×32 and soft vector (`docs/art-direction/*.png`).
- **Done:** rules, palette and the sprite approach are in `docs/ART_DIRECTION.md`.
- **Still open:** the Andika font download and the CC0 scenery packs (Kenney) wait for the user's OK.

### Task 9 — Real world and character graphics
- Replace placeholders on the map with the chosen style.
- Base character with a walk animation in three drawn directions (side mirrored).
- A contact-sheet script that renders every sprite into PNG sheets Claude can review.

### Task 10 — Wardrobe and item catalogue
- Layered items with slots and drawing order, one shared character renderer, mask-based clothing and anchor points.
- 15–20 items across all five rarities following the time-to-earn table; locked previews.

### Task 11 — Smarter learning
- Leitner-box mastery per letter and word; gentle, reversible adaptation.
- More content and difficulty levels.
- Project picture cards replacing emoji.

Status 2026-10-23:
- **Done (`src/learning`):**
  - Mastery boxes per challenge item; rounds favour what is still being learned.
  - Save format version 2, with the first upgrade step.
  - First-try results per question.
- **Not started:**
  - Difficulty adaptation (options in `docs/OVERNIGHT_NOTES.md`).
  - More content: needs the user's approval of new words and letters.
  - Picture cards: waits for the art style (Task 8).

---

## Roadmap — later

Not scheduled. Pull an item in when it becomes the most valuable next step.

**Learning**
- Letter-sound challenge, after a dedicated TTS test ("S som i sol" as fallback).
- Initial-sound identification including tricky words (sj-, tj- and j-sounds).
- Rhyme (rim) and syllable clapping (stavelser).
- Lower-case letters.
- Letter tracing with a finger.
- Mathematics region.

**World and game**
- More regions, shown as locked places first.
- Discoveries: hidden things the guide names when tapped ("En groda!").
- A guide character who speaks instructions and feedback, and gently repeats a question if the child is idle.
- Pets, starting with one that follows the character.
- Sticker album for achievements.
- Optional virtual joystick.

**Character**
- Skin tones, hairstyles, hair and eye colours, and a picture-only character creator. Always free, never locked.
- More slots (outerwear, glasses, face details) as the art allows.

**Sound**
- Generated sound effects, quiet optional music, separate volume settings.

**Adults**
- Parent area behind a simple gate (written instruction plus press-and-hold): settings, progress overview, save export/import, reset.
- Multiple local profiles.

**Accessibility**
- Reduced motion, high-contrast option, a settings screen.

**Tools**
- Asset workshop page: sprites, directions, outfits, missing or invalid assets.
- Determinism test for generated assets.

**Release**
- Release review: privacy, licences (assets, fonts, TTS terms), accessibility, performance, README and release checklist. Labelled beta until reviewed.
