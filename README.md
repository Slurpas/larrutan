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

## Testing on an iPad

1. Make sure the iPad and this computer are on the same network.
2. Run `npm run dev`.
3. Vite prints two addresses. Open the **Network** one on the iPad in Safari, for example `http://192.168.1.90:5173/`.
   - The port is 5173 unless that port is busy; then Vite picks the next free one and prints it.
4. If the iPad can't connect, Windows Firewall may be blocking Node.js. Allow Node.js on **private** networks when Windows asks, and check that your network is set to Private.

Hold the iPad sideways (landscape). In portrait a small picture hint asks to turn it.
