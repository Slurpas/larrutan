# Overnight notes (2026-10-23)

You asked me to keep working while you sleep:
- Hold back decisions that can wait.
- Make the ones I need in order to proceed.
- For every decision I make, list the options I would have asked you about.

This file is the running summary for our morning talk. When we've been through it, the agreed decisions move to `docs/REVIEW.md` and this file is deleted.

Each task is committed on its own (local commits only, nothing pushed or published), so any of them can be changed or reverted.

## Waiting for you

| # | What | Why it waits |
|---|---|---|
| W1 | **Hosting:** Cloudflare Pages (my pick) or GitHub Pages | You create the account; GitHub Pages would make the repository public |
| W2 | **Voice:** stay with Alma (Piper) or switch to a Gemini voice (Vindemiatrix, Sulafat; Achernar and Erinome not sampled yet) | Your ear decides. Gemini's free tier is 10 requests/day, resetting about 09:00 |
| W3 | **iPad checks** for Task 7: install from Safari, play in flight mode, check the voice with the silent switch on | Needs hosting (HTTPS) first |
| W4 | **Voice review:** go through the 209 clips on `?review=voices` (about 15–20 minutes) | Only your ear can approve them |

## Task 6 — Voice review page (done; the review itself is yours)

**Built:**
- **Review page:** `http://localhost:5173/?review=voices`, also on the iPad via the Network address.
  - All 209 clips are listed per letter, per word, and one group for the map and rewards.
  - Each clip has ▶ Play, **Good** and **Wrong**, plus a note box for wrong ones ("säger öka").
  - PC keys: ↓ next (plays), A good (then plays the next), R wrong, U undo.
  - Clips you mark stay in view until you switch the filter.
- **Saving:** decisions go to `src/speech/audio/sv/approvals.json`, through an endpoint that only exists on the dev server.
- **Status report:** `npm run speech` prints how many clips are good, wrong or unreviewed, and lists the wrong ones with your notes. That's my to-do list for fixes.
- **File names:** a clip's name now hashes its text, its pronunciation fix and the voice. A fixed or re-voiced clip gets a new name, so it shows up as "to review" again, and Brave can't play an old cached version. That was the bug I found last night.
  - The existing 209 clips were renamed, not regenerated, so they sound exactly as before.
- **Clean-up:** eight old spoken-praise clips ("Rätt!", "Bra jobbat!", "Toppen!"…) were still in the repo and in every build, because a delete in my sandbox failed silently. Removed.

**Tests:**
- Unit tests for approvals: save, undo, refusing bad requests, forgetting decisions on regenerated clips.
- A browser test of the page in Chromium and WebKit, with a faked endpoint, so tests never touch your approvals file.
- The real endpoint was checked once on your dev server: save, undo, and refusing `../../package.json`. The file is back to empty.

**Decisions I made:**

| Decision | Chosen | Alternatives |
|---|---|---|
| Where decisions are saved | `approvals.json` in the repo, via the dev server (committed like the clips) | Browser storage (lost with the browser, and I couldn't read it); or you tell me in chat (slow for 209 clips) |
| Page language | English (an adult tool, like `?debug=voices`) | Swedish |
| Release builds and unapproved clips | Not enforced yet; reported by `npm run speech` and on the page | Leave unapproved clips out (the game goes silent there in Brave); or fail the build (blocks deploys until all 209 are reviewed) |
| Re-review after a fix | Automatic: new name, so "to review" again | Keep the old approval (could approve audio you never heard) |
| The page in release builds | Not included (dev only) | Included, but saving wouldn't work on the hosted site |

**Waiting for you:** go through the clips when you have 15–20 minutes. I fix the wrong ones from your notes.

## Task 7 — Saving and iPad install (done except hosting)

**Built:**
- Saving in IndexedDB, with per-field repair, a backup of broken saves, and never overwriting a save it couldn't read or one from a newer version.
- PWA: manifest, app icon, iPad home-screen tags and a service worker that caches the whole game for offline play.
- Phaser loads lazily: the first download went from 471 KB to 113 KB gzipped.
- A credits and version line on the start screen.

**Tests:**
- Unit: 119 pass.
- Browser: 40 pass, including saving, repair, and offline play with voice in Chromium and WebKit.

**Decisions I made, and the options I would have asked about:**

| Decision | Chosen | Alternatives |
|---|---|---|
| Offline cache | A hand-written service worker (~70 lines), no new dependency | `vite-plugin-pwa` (Workbox): standard and well tested, but a large dependency tree that needs your OK |
| When an update arrives | On the next start of the game, never mid-round | Update at once and reload (could interrupt a child); or show a "new version" button (an adult would have to press it) |
| Persistent storage | Requested only in the installed app | Always (Firefox would ask the child a question); or never (Safari may clear data under storage pressure) |
| Broken save | Repair field by field and keep a backup | Reset everything (simpler, loses progress); or refuse to start (a child can't fix that) |
| Save from a newer version | Play it, never overwrite it | Overwrite (loses newer data after a rollback) |
| Round ledger (double-event guard) | Not saved; it only matters within a session | Save it (grows forever) |
| Credits | Small print on the start screen (required by Alma's CC BY licence once public) | A separate credits screen (more UI for adults) |
| Version label | Build time, bottom right of the start screen, release builds only | Git hash (meaningless to you); or nothing (hard to tell if the iPad updated) |
| Search engines | `noindex` until the release review | Indexed (premature for a beta) |
| Paths | Relative (`base: './'`), so it works on any host or subfolder | Absolute (would tie us to one host setup) |
| App icon | White "A" with a dark outline on sky and hills, matching the start screen | Other motifs (book, the character, "Lä"); easy to redraw |

**Left over:**
- [ ] W1 hosting, then a `deploy` script and README steps.
- [ ] W3 iPad checks: install, offline, silent switch, the version label after an update.
- [ ] No reset button yet (the parent area is on the roadmap). To start over, clear the site's data.
