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
- `npm test`: Vitest unit tests (`src/**/*.test.ts(x)`)
- `npm run test:e2e`: Playwright (`tests/e2e`), desktop Chromium + iPad WebKit, on its own port 5199. `offline.spec.ts` runs against a release build (built into `.e2e-dist`, served on 4199), because the service worker only exists there
- `npm run build`: typecheck + Vite build
- `npm run speech`: generate missing speech clips with Piper (setup in README). Run it after any change to letters, words, phrases, challenge wording, `src/content/pronunciation.ts` or `src/speech/voiceSettings.ts`; `catalogue.test.ts` fails until you do. It also prints the review status and lists rejected clips with the user's notes
- `npm run sfx`: re-synthesise the sound effects (chime, fanfare, level-up, new item) in `src/sound/sfx/`
- `npm run icons`: render `scripts/app-icon.svg` to the PNG app icons in `public/icons/`

Before reporting a task done, run typecheck, lint, test, test:e2e and build.

## Code layout

- `src/app`: shell, start screen, touch setup, seeds
- `src/challenges`: `ChoiceChallenge` (the shared screen: speech, hints, praise, progress, keyboard), shared round logic, and one folder per challenge with its pure round builder and a thin wrapper. `difficulty.ts`: easy/hard levels; a sign opens the first level not yet completed. Hard = exactly one look-alike of the answer (`letterChoices.ts`)
- `src/content`: letters, words, phrases (typed data) and `validation.ts` with the PRD §5 content rules
- `src/speech`: `speech.ts` is the one entry point (`speak`, `stopSpeech`, …). It plays generated clips from `audio/sv/` and falls back to the device voice (`browserVoice.ts`) only for a sentence without a clip or a clip that won't play. `catalogue.ts` lists every sentence (grouped for review); challenge wording lives in `src/challenges/voices.ts`. A clip's file name hashes its text, pronunciation fix and voice (`clipName.ts`, `voiceSettings.ts`), so changed audio always gets a new name. `review/`: the clip review page (`?review=voices`, dev server only) and approvals (`audio/sv/approvals.json`, saved by `scripts/voiceReviewPlugin.ts`)
- `src/world`: the hub map (Phaser). `hubMap.ts` is the map as a text grid; `tileMap.ts`, `pathfinding.ts` and `camera.ts` are pure, tested rules; `HubScene.ts` draws and moves; `HubWorld.tsx` mounts it in React
- `src/rewards`: reward rules (`rules.ts`, all numbers in one place), hats (`items.ts`), pure progress logic (`progress.ts`, exactly-once by round id), the store (`store.ts`: loads the save at startup, saves after every change), the XP bar and "Mina saker"
- `src/persistence`: saving (PRD §12). `saveFile.ts` is the pure, tested save format (version, per-field repair); `database.ts` is the thin IndexedDB layer; `saveGame.ts` loads and saves the default profile
- `src/pwa`: the service worker template (filled in by the plugin in `vite.config.ts`) and its registration (release builds only)
- `src/ui`: shared buttons, icons, helpers

## Gotchas

- `?seed=123` in the URL replays a round; the seed shows in the corner of each challenge.
- The dev server on Windows can miss a second quick edit to the same file and serve stale code. If behaviour doesn't match the source, restart it.
- The user keeps their own `npm run dev` running on 5173. Don't start a second dev server: open http://localhost:5173 in the pane, and only ever give the user the 5173 address. A server Claude starts dies with the session, and a tab left on it keeps running but gets no sound (clip error code 4).
- Playwright won't tap an element that's animating forever (the pulsing revealed answer); use `{ force: true }` there.
- The in-app browser pane misplaces clicks when it emulates a viewport size. For iPad-sized visual checks, drive WebKit with Playwright and screenshot.
- Phaser: the canvas must stay absolutely positioned (React mounts twice in dev and a dying canvas would push the new one down, breaking tap positions), and movement uses `performance.now()` because Phaser's own time/delta are smoothed and run slow on slow devices.
- The map stays mounted while a challenge is open (overlay on top); the game loop sleeps and keyboard listeners are removed meanwhile.
- Speech: the user plays in Brave on Windows, which has no Swedish voice at all, so never rely on the device voice. Praise and celebrations are sound effects, never words (user feedback). Piper guesses pronunciation from spelling and gets some words wrong (soft k in "keps", stress in "ananas"): print the IPA with `voice.phonemize()` and fix words in `src/content/pronunciation.ts`. espeak-ng (inside Piper) can't read data from a path containing "ä"; `scripts/piper_batch.py` copies it to the temp folder. `?debug=voices` shows the speech log.
- The service worker only runs in release builds (`npm run build` + `npm run preview`, or the hosted site), never on the dev server. A new version takes over on the next start of the game; the start screen of a release build shows its build time.
- Phaser loads lazily (`src/world/loadHubGame.ts`): the map appears a moment after the HUD on a slow first load.
- Deleting files from Claude's Bash sandbox can fail silently (`rm`/Node report success, the file stays). Use PowerShell `Remove-Item` when a folder must really be emptied, e.g. `dist` before checking a build.
- Dev builds expose `window.__larrutanHub` (player tile, station screen points) for Playwright; see `src/world/hubTestApi.ts`.

## Stack notes

- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TypeScript 7 yet.
- Styling: CSS Modules plus design tokens in `src/index.css`. Touch targets at least 64 px.
- iPad touch setup (pressed-button states, gesture blocking) lives in `src/app/touchBehaviour.ts` and `src/index.css`.
