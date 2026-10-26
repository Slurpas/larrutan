# Lärrutan

Swedish literacy adventure game for children aged 5–7. Browser first, iPad is the priority device. Free: no ads, no purchases, and children's data stays on the device.

- Requirements: `docs/PRD.md`
- Task plan and roadmap: `docs/CLAUDE_TASKS.md`
- Review and decision history: `docs/REVIEW.md`

## Roles

- Claude does all code, **all graphics and all audio** (generated, or sourced with a clear licence). The user does no visual work and records no audio.
- The user approves or rejects, suggests changes, tests on an iPad and playtests with a child. So always show visual results (screenshots, sample sheets) and end each task with a short "Check on the iPad" list.

## Working rules

- Do one task from `docs/CLAUDE_TASKS.md`, then stop for review. Never continue into the next task automatically.
- Read the relevant docs and code before editing. Keep changes focused on the task; no broad rewrites or renames of unrelated code.
- Prefer the simplest thing that works. Playable first; no speculative abstractions, engines or infrastructure.
- No backend, accounts, analytics, paid dependencies, or runtime calls to external services. Ask before adding any dependency.
- Child-facing text and speech are Swedish. Code, comments and docs are English.
- Content (letters, words, pictures, spoken text) lives in typed data files, never inside UI components.
- Every external asset (graphics, font, sound) needs a clear licence, logged in `docs/ASSET_LICENSES.md`.
- Never claim browser, iPad or visual verification that wasn't actually done.
- If a requirement conflicts with the code or with another requirement, explain the conflict and propose the smallest safe change.
- Update the docs when a decision changes.

## Reporting after a task

Changed files, commands run and their results, screenshots, known limitations, a "Check on the iPad" list, and the recommended next task.

## Commands

- `npm run dev`: dev server, also on the local network for iPad testing. Always port 5173 (`strictPort`); a second copy fails instead of moving to 5174
- `npm run typecheck`: `tsc -b` over `tsconfig.app.json` (src) and `tsconfig.node.json` (configs, tests)
- `npm run lint`: ESLint
- `npm test`: Vitest unit tests (`src/**/*.test.ts(x)` and `scripts/**/*.test.ts`)
- `npm run test:e2e`: Playwright (`tests/e2e`), desktop Chromium + iPad WebKit, on its own port 5199. Silent: specs import `test` from `tests/e2e/fixtures.ts` (ESLint enforces it), which keeps every clip away from the browser's media engine and fakes playback events, because test audio reached the user's speakers (muting alone didn't stop WebKit). `offline.spec.ts` runs against a release build (built into `.e2e-dist`, served on 4199), because the service worker only exists there
- `npm run build`: typecheck + Vite build
- `npm run speech`: generate missing speech clips with the engine of `speechVoice` (`src/speech/voiceSettings.ts`; ElevenLabs since 2026-10-25, key in `.env`, setup in README). `npm run speech -- --samples` is the ElevenLabs trial (key in `.env`; spends real credits, at most `--max-credits`, so run it only when the user says so), `-- --list-voices` lists the account's voices. Run it after any change to letters, words, phrases, challenge wording, `src/content/pronunciation.ts` or `src/speech/voiceSettings.ts`; `catalogue.test.ts` fails until you do. It also prints the review status and lists rejected clips with the user's notes
- `npm run sfx`: re-synthesise the sound effects (chime, fanfare, level-up, new item, pop) in `src/sound/sfx/`. `playEffect` plays one alongside speech; `speak({ sound })` plays it in the speech queue, and `speak({ pause: ms })` waits there
- `npm run icons`: render `scripts/app-icon.svg` to the PNG app icons in `public/icons/`
- `npm run sprites`: render every sprite into `docs/sprites/contact-sheet.png`, every wardrobe item into `docs/sprites/wardrobe.png`, every challenge picture into `docs/sprites/pictures.png`, and the numbered ideas for new items and pets (`src/art/itemCandidates.ts`, not in the game) into `docs/sprites/candidates.png` for review (run after changing `src/art`)
- Deploy: push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) runs lint, unit tests and the build, then publishes to https://slurpas.github.io/larrutan/. Pushing publishes, so push only when the user has asked to.

Before reporting a task done, run typecheck, lint, test, test:e2e and build.

## Code layout

- `src/app`: shell, start screen, touch setup, seeds
- `src/challenges`: `useChoiceRound` (what every challenge screen shares: asking, graduated help, praise, finishing the round), `ChallengeTopBar`, the card screen `ChoiceChallenge`, the mine cart screen `mineCart/MineCart` (Gruvvagnen, used by Första bokstaven; pure ride rules in `mineCart/ride.ts`), the dragon screen `dragon/Dragon` (Mata draken, used by Hitta bokstaven), the spelling screen `spelling/Spelling` (Bygg ordet: pure rules in `spelling/spellingState.ts`, bubble layout in `spelling/bubbleLayout.ts`), the card game `memory/Memory` (pure rules in `memory/memoryState.ts`), the card-pile game `sorting/Sorting` (Sortera korten: pure rules and a solver that proves every deal can be sorted in `sorting/sortingState.ts`), the basket game `baskets/Baskets` (Bokstavskorgarna: pure rules in `baskets/basketsState.ts`), `letterSets.ts` (the letters and pictures of both sorting games), `sceneScale.ts` (the whole-number zoom of the game scenes), and one folder per challenge with its pure round builder and a thin wrapper. `levels.ts`: the four levels of every station (what a round is built with, and the sentence said on the first round there), the round score with guessing taken out (`chanceCorrected`), and the rule that moves a station, saved per station (`levelRule`: two rounds averaging at least 0.8 go up, at most 0.3 go down). `difficulty.ts`: whether a level offers the answer's look-alikes (`letterChoices.ts`)
- `src/content`: letters, words, phrases (typed data) and `validation.ts` with the PRD §5 content rules
- `src/speech`: `speech.ts` is the one entry point (`speak`, `stopSpeech`, …). It plays generated clips from `audio/sv/` and falls back to the device voice (`browserVoice.ts`) only for a sentence without a clip or a clip that won't play. `catalogue.ts` lists every sentence (grouped for review); challenge wording lives in `src/challenges/voices.ts`. A clip's file name hashes its text, pronunciation fix, voice and retake (`clipName.ts`, `voiceSettings.ts`, `retakes.ts`), so changed audio always gets a new name. `review/`: the clip review page (`?review=voices`, dev server only) and approvals (`audio/sv/approvals.json`, saved by `scripts/voiceReviewPlugin.ts`)
- `src/world`: the hub map (Phaser). `hubMap.ts` is the map as a text grid; `tileMap.ts`, `pathfinding.ts`, `camera.ts` (whole-number zoom for pixel art) and `groundTiles.ts` (which tile or sprite each map square shows) are pure, tested rules; `textures.ts` turns `src/art` grids into Phaser textures; `HubScene.ts` draws and moves; `HubWorld.tsx` mounts it in React. Tapping a house walks to its door (`houseAt` in `tileMap.ts`): the blue one is the child's home, the red one answers a knock with "Zzz"
- `src/home`: the child's room in the blue house (`Home.tsx`, art in `src/art/home.ts`): the wardrobe opens "Mina saker", the mirror makes the child twirl to show their back
- `src/art`: 16×16 pixel art (`docs/ART_DIRECTION.md`). `palette.ts` (Kenney's colours), sprites as text grids (`character.ts`, `signs.ts`, `scenery.ts`, drawn with the `pixels.ts` helper), and `kenney.ts` (the Tiny Town tiles in use, sheet and licence in `kenney/`). The wardrobe: item art in `wardrobe.ts` (recolours for tops and trousers, placed sprites for the rest) and `outfit.ts`, the one character renderer (`composeCharacter`) for the map, "Mina saker" and the reward screen. `pictures.ts`: one 32×32 picture per word, keyed by word id, shown by `src/ui/Picture.tsx`. `mine.ts`: Gruvvagnen's tiles and the cart with its rider. `bubbles.ts`: bubbles, the meadow and the character with a bubble wand. `dragon.ts`: the dragon's faces (a "yuck" one for a refused cookie), the fire and smoke puffs, and the letter cookies. `memory.ts`: Memory's card back. `baskets.ts`: Bokstavskorgarna's straw basket
- `src/rewards`: reward rules (`rules.ts`, all numbers in one place), the item catalogue (`items.ts`: slot, rarity, unlock, spoken hint), pure progress logic (`progress.ts`, exactly-once by round id; `itemsSeen` counts the items the child has seen, the rest are new), the store (`store.ts`: loads the save at startup, saves after every change), the XP bar and "Mina saker"
- `src/learning`: mastery (`mastery.ts`): Leitner boxes per challenge item, updated from first-try results, and `practiceOrder`, which round builders use to favour what is still being learned (identical to a plain shuffle for a new player)
- `src/persistence`: saving (PRD §12). `saveFile.ts` is the pure, tested save format (version, per-field repair); `database.ts` is the thin IndexedDB layer; `saveGame.ts` loads and saves the default profile
- `src/pwa`: the service worker template (filled in by the plugin in `vite.config.ts`) and its registration (release builds only)
- `src/ui`: shared buttons, icons, helpers

## Gotchas

- The repository is public: never commit secrets (`.env` is ignored) or personal data. Commits use the GitHub no-reply address (repository `user.email`).

- `?seed=123` in the URL replays a round; the seed shows in the corner of each challenge. Rounds also depend on the player's mastery, so a seed gives the same round only for the same practice history (always the same for a new player).
- The dev server on Windows can miss a second quick edit to the same file and serve stale code. If behaviour doesn't match the source, restart it.
- The user keeps their own `npm run dev` running on 5173. Don't start a second dev server: open http://localhost:5173 in the pane, and only ever give the user the 5173 address. A server Claude starts dies with the session, and a tab left on it keeps running but gets no sound (clip error code 4).
- Playwright won't tap an element that's animating forever (the pulsing revealed answer); use `{ force: true }` there.
- The in-app browser pane misplaces clicks when it emulates a viewport size. For iPad-sized visual checks, drive WebKit with Playwright and screenshot.
- Phaser: the canvas must stay absolutely positioned (React mounts twice in dev and a dying canvas would push the new one down, breaking tap positions), and movement uses `performance.now()` because Phaser's own time/delta are smoothed and run slow on slow devices.
- The map stays mounted while a challenge is open (overlay on top); the game loop sleeps and keyboard listeners are removed meanwhile.
- Speech: the user plays in Brave on Windows, which has no Swedish voice at all, so never rely on the device voice. Praise and celebrations are sound effects, never words (user feedback). Since 2026-10-25 the voice is ElevenLabs Eleven v3 with a voice the user designed (`speechVoice`): every new sentence costs credits (10,000 a month on the free plan, the game is about 8,300), so a full remake needs `--max-credits` and the user's OK. Its answers are cached in `.tools/elevenlabs-cache`, so changing only a clip's finishing costs nothing. v3 pauses about a second at a pause mark; the generator cuts it to `pauseSeconds` (0.7), and cuts off a long silence that ends in a click (`tidyElevenLabs`). The pronunciation fixes below are for Piper only. ElevenLabs reads the plain text, except for its own fixes in `elevenLabsFixes` (`src/content/pronunciation.ts`): v3 stresses a word written in capitals, so "ta på den", which it ran together as "TApå den", is sent as "ta PÅ den". A fix renames the clip, so it is recorded again (credits). A retake gives ElevenLabs a new seed. The ffmpeg build here fails an assertion on some clips when loudnorm and the 24 kHz output share one run, so `finish` uses two. Piper (Alma, `almaVoice`): Piper guesses pronunciation from spelling and gets some words wrong (soft k in "keps", stress in "ananas"): print the IPA with `voice.phonemize()` and fix words in `src/content/pronunciation.ts`. Alma drops the sj-sound (ɧ) completely, so words with it use ʂ instead (sju, skylt, stjärn-). Piper says a sentence a little differently each time: when the words are right but one recording slipped (the user heard "Dou fick"), give the sentence a new take in `src/speech/retakes.ts`. When a rejected clip is redone, its review is dropped and the user listens again. Piper makes no real pause inside a sentence, whatever the punctuation. So `withPauses` (same file) marks a pause with `|`, and the generator says the parts separately and joins them with `pauseSeconds` of silence (`voiceSettings.ts`). This is used before the target in "Var är …?". espeak-ng (inside Piper) can't read data from a path containing "ä"; `scripts/piper_batch.py` copies it to the temp folder. `?debug=voices` shows the speech log.
- The service worker only runs in release builds (`npm run build` + `npm run preview`, or the hosted site), never on the dev server. A new version takes over on the next start of the game; the start screen of a release build shows its build time.
- Phaser loads lazily (`src/world/loadHubGame.ts`): the map appears a moment after the HUD on a slow first load.
- Pixel art: Phaser runs with `pixelArt: true` (no smoothing), so any Phaser text must call `text.texture.setFilter(Phaser.Textures.FilterMode.LINEAR)` or it looks jagged. Letters are never drawn as pixels: they use Andika (`src/fonts`, `--font-letters`), and the map waits for the font before drawing signs. Sprites are drawn with their feet at the bottom of their tile and sorted by depth (y), so the character can stand in front of or behind signs and tall trees.
- Deleting files from Claude's Bash sandbox can fail silently (`rm`/Node report success, the file stays). Use PowerShell `Remove-Item` when a folder must really be emptied, e.g. `dist` before checking a build.
- Dev builds expose `window.__larrutanHub` (player tile and screen point, station screen points) for Playwright; see `src/world/hubTestApi.ts`. Tapping the character on the map opens "Mina saker" (`isOnPlayer` in `HubScene.ts`).
- An attention animation that never stops (the reward card's ping) goes on a pseudo-element or a child, never on the button itself: Playwright only taps an element that holds still.
- A new wardrobe item is a data entry in `src/rewards/items.ts` plus its art in `src/art/wardrobe.ts` (`outfit.test.ts` fails if either is missing). Its unlock sentence and hint are spoken, so run `npm run speech` (and check the words' pronunciation), then `npm run sprites` to review it. An idea the user picks from `docs/sprites/candidates.png` moves from `src/art/itemCandidates.ts` (front view only) into `wardrobe.ts` with its side and back views.
- A new word needs its picture in `src/art/pictures.ts` under the word's id (`sprites.test.ts` fails otherwise). Pictures are 32×32, keep a 1-pixel margin for the outline (a test checks nothing runs off the edge), and get reviewed on `docs/sprites/pictures.png`.
- Gruvvagnen moves the world with `requestAnimationFrame` (CSS variables `--shift`, `--gate`, `--dark` on its stage), never React state per frame. It takes about 5 seconds per question, so its browser tests use longer waits (`waitForQuestion(..., rideTimeout)`). Wait for the wall to stop (`click({ trial: true })`) before measuring a card's position. The scene must never scroll (`overflow: clip`, plus a reset for older Safari).
- Mata draken: a cookie chosen while the dragon still shakes its head is kept and fed as soon as it is ready (taps are never lost). Dragging uses pointer capture on the cookie; a short drag counts as a tap.
- Sortera korten and Bokstavskorgarna take taps from `pointerup`, and from `click` only when it comes from the keyboard (`detail === 0`). So the click that ends a drag never counts as a tap (wherever the browser sends it), and no tap is lost when a browser sends no click after a drag. Their cards are drawn in one fixed order (by id): React moves the element of a card that changes place in the list, and a moved element doesn't run its CSS transition, so it would jump instead of sliding.
- Memory draws only the side of a card that shows: Playwright's WebKit can't hide the back of a 3D-turned card (`backface-visibility`), so a 3D flip showed every face.
- Playwright's keyboard has no Å, Ä or Ö (`keyboard.press('å')` throws), so Bygg ordet's keyboard test dispatches those keydown events itself.
- Browser tests open a station at any level through a saved game (`startChallengeAt` in `tests/e2e/helpers.ts`) and check what the game said with `hasSaid` (the silent fixture lists every clip played).

## Stack notes

- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TypeScript 7 yet.
- Styling: CSS Modules plus design tokens in `src/index.css`. Touch targets at least 64 px.
- iPad touch setup (pressed-button states, gesture blocking) lives in `src/app/touchBehaviour.ts` and `src/index.css`.
