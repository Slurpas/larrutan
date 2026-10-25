# Lärrutan

A free Swedish literacy adventure game for children aged 5–7. Browser first, made for iPad.

Status: early prototype (Phase 2 started). See `docs/PRD.md` for the product and `docs/CLAUDE_TASKS.md` for the plan.

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
| `npm run icons` | Render `scripts/app-icon.svg` to the PNG app icons in `public/icons/` |
| `npm run sprites` | Render every sprite and wardrobe item into `docs/sprites/` for review |

## Generating speech

Everything the game says plays from MP3 files in `src/speech/audio/sv/`, generated from the content by ElevenLabs (Eleven v3, a voice the user designed; see "Trying ElevenLabs" below for the key) since 2026-10-25, and before that by the free, offline Piper engine (Alma, still available as `almaVoice`). The files are committed, so this is only needed after changing letters, words or phrases. A unit test fails if any sentence is missing its file. With ElevenLabs each new sentence costs credits; a full remake must be given `--max-credits`.

One-time setup for Piper, only needed to switch back to Alma (Python 3 and ffmpeg on PATH needed; everything installs into `.tools/`, which git ignores):

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

### Trying ElevenLabs

ElevenLabs is a second engine, tried against Alma on 2026-10-25 and not used by the game yet. Its free plan gives 10,000 characters a month, for non-commercial use, and published clips must credit "elevenlabs.io". Like every engine here, it is only called when clips are made: each sentence is made once and kept as an MP3, and the game never calls it.

1. Make a free account at elevenlabs.io (no card) and create an API key. A key that may only do Text to Speech is enough: the trial then uses ElevenLabs' own voices by ID and can't read the credits left, so `--max-credits` is the only limit. Allow Voices (read) for `--list-voices`, and User (read) to see the credits left.
2. Add `ELEVENLABS_API_KEY=your-key` to `.env` (git ignores it).
3. Try it:

```bash
npm run speech -- --samples
```

It says 10 game sentences in each voice of `trialPiperVoices` (Piper's Lisa, free and offline) and `trialVoices` (ElevenLabs), both in `src/speech/voiceSettings.ts`, next to Alma's clips, on `http://localhost:5173/voice-samples/index.html`. Without a key it tries only the Piper voices. A voice made with ElevenLabs' Voice Design goes in `trialVoices` with its `voiceId`, so a speech-only key can use it. Each trial clip is kept, so running it again only pays for voices or sentences not tried before; four new voices cost about 800 credits. A run never spends more than `--max-credits` (1000 for the trial unless you give another number) or than the month has left. Free accounts can't use ElevenLabs' library voices through the API (Charlotte was refused), only its own default voices or one made with Voice Design. `npm run speech -- --list-voices` shows the voices the account can use. `--voices "Name,Other"` tries others, for example one made with ElevenLabs' Voice Design, and `--model` picks another model.

To switch the game to an ElevenLabs voice, set `speechVoice` to it in `src/speech/voiceSettings.ts`. Then run `npm run speech -- --max-credits N`. Every clip gets a new name, so all of them are made again, and a full run must be given its credit limit. The pronunciation fixes in `src/content/pronunciation.ts` are for Piper and are not sent to ElevenLabs.

### Reviewing the voice

Open the game on the dev server with `?review=voices`, for example `http://localhost:5173/?review=voices` (or the Network address on the iPad).

- Every clip is listed per letter and per word. Play each one and mark it **Good** or **Wrong**; for a wrong one, write what's wrong.
- On a PC, the keys are faster: ↓ plays the next clip, A marks it good (and plays the next), R marks it wrong.
- Decisions are saved in `src/speech/audio/sv/approvals.json`. `npm run speech` lists the wrong ones.
- A fixed clip gets a new file name, so it shows up as "to review" again.

## Testing on an iPad

1. Make sure the iPad and this computer are on the same network.
2. Run `npm run dev`.
3. Vite prints two addresses. Open the **Network** one on the iPad in Safari, for example `http://192.168.1.90:5173/`.
   - The port is always 5173. If `npm run dev` says the port is in use, the game is already running in another window: use that one.
4. If the iPad can't connect, Windows Firewall may be blocking Node.js. Allow Node.js on **private** networks when Windows asks, and check that your network is set to Private.

Hold the iPad sideways (landscape). In portrait a small picture hint asks to turn it.

## The hosted game

The game is published at **https://slurpas.github.io/larrutan/** (GitHub Pages; the repository is public).

- Every push to `main` deploys automatically (`.github/workflows/deploy.yml`): lint, unit tests and a release build, then publish. That takes a minute or two.
- Watch it on the repository's **Actions** tab.
- The site is hidden from search engines until the release review.

## Saving, offline play and installing

- Progress is saved on the device (IndexedDB) after every round and when something is put on or taken off. Nothing leaves the device.
- To start over, clear the site's data in the browser. On an iPad home-screen app, remove the app and add it again.
- A release build (`npm run build`) works offline after the first visit and can be added to the iPad home screen: in Safari, tap Share, then **Add to Home Screen**. It then opens full screen with its own icon.
- Installing needs HTTPS, so it only works from the hosted site (https://slurpas.github.io/larrutan/), not from the `http://192.168.…` dev address.
- After an update, the new version starts the second time the game is opened.
- The build time in the bottom-right corner of the start screen shows which version is running.
