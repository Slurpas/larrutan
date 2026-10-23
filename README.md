# Lärrutan

A free Swedish literacy adventure game for children aged 5–7. Browser first, made for iPad.

Status: early prototype (Phase 1). See `docs/PRD.md` for the product and `docs/CLAUDE_TASKS.md` for the plan.

## Requirements

- Node.js 22.12 or newer (developed on Node 24)

## Setup

```bash
npm install
npx playwright install chromium webkit
```

The second command downloads the browsers used by the browser tests (about 380 MB, once).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (local and on your network) |
| `npm run build` | Type check, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` folder |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright, desktop Chromium + iPad WebKit) |
| `npm run speech` | Generate missing speech clips (see below) |
| `npm run sfx` | Re-synthesise the sound effects in `src/sound/sfx/` (needs ffmpeg) |

## Generating speech

Everything the game says plays from MP3 files in `src/speech/audio/sv/`, generated from the content with the free, offline Piper text-to-speech engine. The files are committed, so this is only needed after changing letters, words or phrases. A unit test fails if any sentence is missing its file.

One-time setup (Python 3 and ffmpeg on PATH needed; everything installs into `.tools/`, which git ignores):

```bash
python -m venv .tools/piper-venv
.tools/piper-venv/Scripts/python -m pip install piper-tts==1.8.0
.tools/piper-venv/Scripts/python -m piper.download_voices sv_SE-alma-medium --data-dir .tools/piper-voices
```

(On macOS/Linux use `.tools/piper-venv/bin/python`.)

Then:

```bash
npm run speech
```

It generates new clips, regenerates any whose pronunciation or voice settings changed, and deletes unused ones; `npm run speech -- --all` regenerates everything. Words the engine says wrong are fixed in `src/content/pronunciation.ts`. Open the game with `?debug=voices` to see what plays and why.

## Testing on an iPad

1. Make sure the iPad and this computer are on the same network.
2. Run `npm run dev`.
3. Vite prints two addresses. Open the **Network** one on the iPad in Safari, for example `http://192.168.1.90:5173/`.
   - The port is always 5173. If `npm run dev` says the port is in use, the game is already running in another window: use that one.
4. If the iPad can't connect, Windows Firewall may be blocking Node.js. Allow Node.js on **private** networks when Windows asks, and check that your network is set to Private.

Hold the iPad sideways (landscape). In portrait a small picture hint asks to turn it.
