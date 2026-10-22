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

- `npm run dev`: dev server, also on the local network for iPad testing (port 5173, or the next free one)
- `npm run typecheck`: `tsc -b` over `tsconfig.app.json` (src) and `tsconfig.node.json` (configs, tests)
- `npm run lint`: ESLint
- `npm test`: Vitest unit tests (`src/**/*.test.ts(x)`)
- `npm run test:e2e`: Playwright (`tests/e2e`), desktop Chromium + iPad WebKit, on its own port 5199
- `npm run build`: typecheck + Vite build

Before reporting a task done, run typecheck, lint, test, test:e2e and build.

## Code layout

- `src/app`: shell, start screen, touch setup, seeds
- `src/challenges`: `ChoiceChallenge` (the shared screen: speech, hints, praise, progress, keyboard), shared round logic, and one folder per challenge with its pure round builder and a thin wrapper
- `src/content`: letters, words, phrases (typed data) and `validation.ts` with the PRD §5 content rules
- `src/speech`: speech output (browser voice for now) and the no-voice warning
- `src/ui`: shared buttons, icons, helpers

## Gotchas

- `?seed=123` in the URL replays a round; the seed shows in the corner of each challenge.
- The dev server on Windows can miss a second quick edit to the same file and serve stale code. If behaviour doesn't match the source, restart it.
- Playwright won't tap an element that's animating forever (the pulsing revealed answer); use `{ force: true }` there.
- The in-app browser pane misplaces clicks when it emulates a viewport size. For iPad-sized visual checks, drive WebKit with Playwright and screenshot.

## Stack notes

- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support TypeScript 7 yet.
- Styling: CSS Modules plus design tokens in `src/index.css`. Touch targets at least 64 px.
- iPad touch setup (pressed-button states, gesture blocking) lives in `src/app/touchBehaviour.ts` and `src/index.css`.
