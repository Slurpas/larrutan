# Overnight notes (2026-10-23)

You asked me to keep working while you sleep:
- Hold back decisions that can wait.
- Make the ones I need in order to proceed.
- For every decision I make, list the options I would have asked you about.

This file is the running summary for our morning talk. When we've been through it, the agreed decisions move to `docs/REVIEW.md` and this file is deleted.

Each task is committed on its own, so any of them can be changed or reverted. Everything was pushed to GitHub in the morning, once you chose hosting.

## Start here

**Done tonight** (hashes as they are after the email rewrite; everything was pushed in the morning, once you chose hosting):

| Commit | What |
|---|---|
| `6e1d163` | Task 7: saving on the device, installable PWA, offline play, faster start |
| `de794c0` | Task 6: voice review page; clip names tied to their audio |
| `9bda759` | Task 8: three art style candidates for you to pick from |
| `3820416` | Task 11: mastery per letter and word; rounds favour what is still being learned |
| `36e480b` | Fix: offline cache now works with hosts that redirect `index.html` |
| `99102d5` and after | Task 11: proposal for the next letters and words |

Every check passes on the final state:
- typecheck, lint and build
- 135 unit tests
- 42 browser tests in Chromium and iPad WebKit, including offline play

**You can try now**, with no hosting needed and your dev server on 5173:
- **The game:** `http://localhost:5173`. Progress now survives a reload, and rounds start adapting after a few rounds.
- **The voice review page:** `http://localhost:5173/?review=voices`.
- **The art candidates:** open `docs/art-direction/overview.png`.

**Suggested order for our talk:**
1. **W1 hosting**, so you can install on the iPad.
2. **W5 art style**, which unblocks Tasks 9 and 10.
3. **W8 new content.**
4. **W7 learning options.**
5. **W2 voice.**
6. **W6 downloads.**
7. **W4 voice review**, whenever you have 15–20 minutes.

## Waiting for you

| # | What | Why it waits |
|---|---|---|
| ~~W1~~ | **Hosting: decided, GitHub Pages.** Live at https://slurpas.github.io/larrutan/. The repository is public, with commit emails switched to GitHub's no-reply address first | Done |
| W2 | **Voice:** stay with Alma (Piper) or switch to a Gemini voice (Vindemiatrix, Sulafat; Achernar and Erinome not sampled yet). *Speed decided 2026-10-23: 1.4, with a pause before the target in "Var är … Å?". All clips regenerated.* | Your ear decides. Gemini's free tier is 10 requests/day, resetting about 09:00 |
| W3 | **iPad checks** for Task 7: install from Safari, play in flight mode, check the voice with the silent switch on | Ready now, see "Check on the iPad" below |
| W4 | **Voice review:** 76 approved so far. The second round of 9 rejected clips is redone (2026-10-23): M is now said "emm" (it sounded like N), stjärntröja has an explicit r, "orden" a plain d, and "Var är Ä?", "Var är Ö?" and "Du fick gröna byxor!" have fresh takes. Please listen to those 13 again (they're at the top of "To review"), then the other 146 | Only your ear can approve them |
| ~~W5~~ | **Art style: decided, 16×16 pixel art** (`docs/ART_DIRECTION.md`) | Done |
| ~~W6~~ | **Downloads: approved.** Kenney's Tiny Town and Andika are in the game (Task 9) | Done |
| W7 | **Learning:** difficulty adaptation, yes or no and which option? A `?debug=mastery` page for playtests? | Changes how the game behaves for your child |
| W8 | **New content:** approve the next letters (R, N, T, F) and 15 words in `docs/CONTENT_PROPOSAL.md`; E and U wait (sound rules) | You approve content (PRD §5) |
| W9 | **Wardrobe (Task 10):** are the 18 items, their looks and their rarity right? Should the rainbow trousers (every letter mastered) stay epic, or become legendary? | Your child's reaction decides |
| W13 | **Bubblor (Task 13):** play Hitta bokstaven (the AÖ sign). Is popping several bubbles fun? Are 7 bubbles too many or too few? Then listen to the 9 new "Hitta alla A!" clips on `?review=voices` | Your child's reaction decides |
| W12 | **Gruvvagnen (Task 12):** play Första bokstaven (the sun + S sign), then Hitta bokstaven (still cards). Which does your child like more? Is the ride too slow or too fast, and does steering by swiping work? | Decides whether more stations become games |
| W11 | **Pictures (Task 11):** 28 pixel pictures replace the emoji (`docs/sprites/pictures.png`). With your child: can they name each one ("Vad är det här?")? I'm least sure about öra, isbit, åska and ängel | Only a child can tell what reads well |
| ~~W10~~ | **Published:** Tasks 9 and 10 are live at https://slurpas.github.io/larrutan/ (pushed 2026-10-23) | Done |

## Task 11 — Smarter learning: mastery (core done)

Tasks 9 and 10 wait for your art pick, so I took the next independent task: Task 11 (PRD §6).

**Built:**
- **Tracking:** every question now records whether the first tap was right.
- **Boxes:** each letter (Hitta bokstaven) and word (Första bokstaven, Ord och bild) sits in a Leitner box from 1 (still learning) to 5 (known well).
  - Right first time moves it up one box; a slip moves it down one.
  - Each challenge has its own boxes.
- **Choosing questions:** rounds favour what is still being learned, and each box comes up about half as often as the one below.
  - Example: a letter still being learned shows up in more than 95% of rounds, while a known letter still comes back in about a third of them.
- **New players:** they get exactly the same rounds as before; the change only kicks in once there is practice history.
- **Saving:** the save format is now version 2, with the first real upgrade step. Your current saves upgrade without losing anything, and a test proves it.
- **Invisible to the child:** no grades, no "you're bad at Ö".

**Fixes found along the way:**
- A key pressed the instant a question appeared could be lost. The key listener is now attached before the screen is drawn.
- A save test could reload before the save had finished writing. The test now waits for the save.
- The full browser suite now passes 3 runs in a row (42/42).

**Decisions I made:**

| Decision | Chosen | Alternatives |
|---|---|---|
| A slip | Down one box ("gentle, reversible") | Classic Leitner: straight back to box 1 (harsh for a 5-year-old) |
| How often known items come back | Half as often per box (weights 8/4/2/1/0.5), never zero | Only "due" items, by time between sessions (more complex, needs dates) |
| Separate or shared boxes | Per challenge: recognising "A" ≠ knowing "apa" starts with A | One box per letter shared by all challenges |
| Hard level | Still always the look-alike letters; mastery only changes their order | Let mastery pick the hard-level letters too |
| Difficulty adaptation | **Not done.** Rounds already adapt their content; this changes the level shown | (a) after a hard round with three or more slips, the sign opens the easy level next time and goes back to hard after an easy success; (b) choose by the average box of the challenge; (c) never change levels automatically |
| An adult view of mastery | Not built (the parent area is on the roadmap) | A hidden `?debug=mastery` page for your playtests (an hour's work) |

**Waiting for you:**
- Do you want difficulty adaptation (option a, b or c)?
- Should I add a `?debug=mastery` page so you can see the boxes while your child plays?

## Task 8 — Art direction (candidates ready; the pick is yours)

**Built:** the same scene (paths, pond, trees, the three signs, the character, the real HUD) drawn in three styles, entirely by code. Start with `docs/art-direction/overview.png`; then compare the `*-ipad.png`, `*-desktop.png` and `*-details.png` files. The details sheets show the character close up, map parts and a challenge card. Full write-up in `docs/ART_DIRECTION.md`.

| Style | In short |
|---|---|
| **A — Pixel 16×16** | Classic adventure look, quickest to make, but tiny: a hat is about 10×4 pixels |
| **B — Pixel 32×32** | Pixel art with room for faces and clothes; about four times the drawing work |
| **C — Soft vector** | Matches the buttons, cards and start screen; sharp on any screen; most room for wardrobe detail |

**My recommendation: C.** It looks like one game together with the UI the child already knows, and it gives hats and clothes room for detail. If you prefer pixel art, B over A.

**Decisions I made:**
- **Three candidates, all drawn by me.**
  - Alternative: the PRD's "own vs CC0" comparison with a Kenney pack. That means downloading files, so it waits for your OK.
- **The vector candidate was added**, though the PRD only names pixel art and CC0 packs.
  - Reason: it fits the existing UI and the wardrobe plans.
  - Alternative: compare only the pixel sizes.
- **Letters stay in a clean font in every style** (PRD rule).
  - The Andika font isn't downloaded yet; it waits for your OK, so the candidates use the system font.

**Waiting for you:**
- The pick: A, B or C, or "show me a CC0 pack too".
- An OK to download Andika (SIL Open Font License, about 300 KB).

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

**Fixed later in the night:** hosts such as Cloudflare Pages and Netlify redirect `/index.html` to `/`. The offline cache stored the page under `index.html`, and browsers refuse to open a page from a stored redirect, so the installed game could have failed to start. It now stores the page as `./` and strips redirects. The offline tests still pass in Chromium and WebKit.

**Check on the iPad** (hosting is ready):
1. In Safari, open https://slurpas.github.io/larrutan/. The start screen shows a build time in the bottom-right corner.
2. Tap Share, then **Add to Home Screen**. The icon should be the white "A" on sky and hills, named Lärrutan.
3. Open it from the home screen. It should start full screen, without Safari's address bar.
4. Play a round, then close the app fully and reopen it. Your level and hat should still be there.
5. Turn on flight mode, reopen the app and play. It should work, voice included.
6. Flip the silent switch, if your iPad has one. Does the voice still play?

**Left over:**
- [x] W1 hosting: GitHub Pages, deployed on every push to `main`.
- [ ] W3 iPad checks: install, offline, silent switch, the version label after an update.
- [ ] No reset button yet (the parent area is on the roadmap). To start over, clear the site's data.
