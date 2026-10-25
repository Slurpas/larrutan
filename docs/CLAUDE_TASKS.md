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

Status 2026-10-23: **done.**
- **The map:** Kenney's Tiny Town scenery (CC0), our own water, rocks, signs and character, and the Andika font for letters.
- **Map layout:** the hub now has two houses, tall trees the child can walk behind, bushes, mushrooms and flower patches.
- **Mina saker:** shows the pixel character.
- **Contact sheet:** `npm run sprites`.
- **Not done:** challenge pictures were still emoji (done later in Task 11). Hats became pixel art in Task 10.

### Task 10 — Wardrobe and item catalogue
- Layered items with slots and drawing order, one shared character renderer, mask-based clothing and anchor points.
- 15–20 items across all five rarities following the time-to-earn table; locked previews.

Status 2026-10-23: **done.**
- **18 items in five slots:** head, top, trousers, back, in the hand.
  - 5 common, 4 uncommon, 4 rare, 3 epic, 2 legendary (list in PRD §10).
  - Unlocks and spoken hints in `src/rewards/items.ts`; the art in `src/art/wardrobe.ts`.
- **One renderer** (`composeCharacter`, `src/art/outfit.ts`) for the map, "Mina saker" and the reward screen.
  - Tops and trousers repaint the body's shirt and trouser colours (masks), so they fit every direction and walk frame.
  - Hats, back items and held items are small sprites placed per facing, drawn behind or in front of the body.
- **"Mina saker":** one row per slot. Each card shows the character wearing the item, back items from behind. Tap to wear (it replaces what was in that slot), tap again to take it off.
- **Unlocks rebalanced:** the hard levels are reachable in the first session, so they now give uncommon items. A simulation in the unit tests checks the time-to-earn table.
- **New unlock type:** mastery, e.g. every letter of Hitta bokstaven in the top box.
- **Save version 3:** what is worn, per slot. Older saves upgrade.
- **Review sheet:** `docs/sprites/wardrobe.png` (`npm run sprites`).

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
  - ~~Picture cards~~: **done 2026-10-23.** 28 pixel pictures replace the emoji (see below).
- **Picture cards, done 2026-10-23:**
  - One 32×32 pixel picture per word (`src/art/pictures.ts`), drawn from shapes in Kenney's palette with the dark outline.
  - Used in Första bokstaven, Ord och bild and on the voice review page. The emoji field is gone from the word data.
  - A test fails if a word has no picture, or a picture has no word, or a picture runs off its frame.
  - Review sheet: `docs/sprites/pictures.png` (`npm run sprites`).

---

### Task 12 — Gruvvagnen: answering by moving

**Goal:** answer by steering instead of tapping cards (the user's idea, 2026-10-23), to see whether a playful action makes practice more fun.

Status 2026-10-23: **prototype done, waiting for a playtest.**
- **The ride:** Första bokstaven is now a mine cart ride (`src/challenges/mineCart`):
  - The cart rolls about 3 seconds and brakes in front of a rock wall with one tunnel per choice, a letter card above each.
  - It then waits as long as the child needs: no timers (PRD §11).
- **Answering:** the child steers into a tunnel.
  - Right: through the tunnel to the next question.
  - Wrong: the tunnel is nailed shut with planks and the cart bumps back gently. The same graduated help as the cards.
- **Controls:**
  - iPad: tap a card or a track; swipe left/right to steer and up to go.
  - Keyboard: arrows to steer, up to go, or the number keys.
  - A choice made while the cart is still rolling in is kept for the stop.
- **The rider:** the child's own character, dressed, sits in the cart.
- **Shared logic:** asking, help and rewards moved to `useChoiceRound`, shared with the card screen; Hitta bokstaven and Ord och bild still use cards, so the two can be compared.
- **Next:** a playtest. If the child likes it, other stations can get their own game on the same rounds.
- **Feedback 2026-10-23:** the tunnels went too dark; now a light dip (0.4 instead of 0.75).

### Task 13 — Bubblor: Hitta bokstaven as a game

**Goal:** the second station as a game (the user's pick, 2026-10-24), with more practice per round.

Status 2026-10-24: **built, waiting for a playtest.**
- **The game:** the child's character blows soap bubbles with letters over a meadow; the voice says "Hitta alla A!" and the child pops every bubble with that letter (`src/challenges/bubbles`).
  - Three bubbles of the asked letter and two of each other letter per question, so 15 right taps per round instead of 5.
  - A wrong letter doesn't pop: all its bubbles turn grey and the voice names it, the same help as everywhere. When only the right letter is left, its bubbles pulse.
  - The bubbles bob in place: nothing is timed and nothing flies away (PRD §11).
- **Controls:** tap a bubble. Keyboard: the letter itself (or 1–3 for the letters in order) pops the next bubble with it; arrows move between bubbles.
- **Sound:** a pop sound (`npm run sfx`) that plays alongside the voice (`playEffect`), never cutting it off.
- **Speech:** "Hitta alla A!" (with the pause before the letter) replaces "Var är A?" for letters; the 9 new clips wait for the voice review.

### Night queue 2026-10-24 (the user asked for these, to review in the morning)

Done one by one, each in its own local commit, not pushed until the user has checked them.

#### Task 14 — Items: at most one per round, a bigger catalogue
- A round gives at most one new item; anything else earned waits for a later round.
- Many more items, so the good ones take real play.

Status 2026-10-24: **done.**
- **At most one item, and only every other round** (rounds 1, 3, 5, …). It is the first earned item in catalogue order (commons first); the rest wait.
- **37 items instead of 18:** colour variants (caps, sweaters, trousers, capes, a backpack, a balloon, wings) and five new pieces of art (party hat, viking helmet, pirate hat, chef's hat, sunflower).
- **Typical pacing** (unit-tested): commons up to round 13, uncommon to round 33, rare from 35, epic from about 60, the crown around round 80, the last legendary at round 150.
- **"Mina saker" scrolls**, since the items no longer fit one screen.

#### Task 15 — Difficulty that is really harder, and says how
- The hard level is clearly harder (four choices, with look-alikes), and the voice says what changed instead of just "Nu blir det svårare".
- A clear rule for when a station goes up a level, and back down (gentle, PRD §6).

Status 2026-10-24: **done.**
- **Hard is really harder:** four choices instead of three, with all the asked letter's look-alikes (A with Å and Ä, O with Ö). The mine cart gets four tunnels.
- **The voice says what changed:** "Nu blir det svårare! Nu finns det fyra tunnlar." (mine cart), "… Några bokstäver är nästan lika. Titta noga!" (letters).
- **When:**
  - An easy round with at most one wrong tap makes the station hard next time. The round end says "Nästa gång blir det svårare." and shows the level pips.
  - A hard round with four or more wrong taps makes it easy again, quietly.
  - The numbers were in `src/challenges/difficulty.ts` (replaced by four levels in Task 23).
- **Saved per station** (save version 4). Older saves keep their current levels.

#### Task 16 — Mata draken (Hitta bokstaven)
- The letter sign becomes a dragon that wants one letter cookie at a time ("bokstavskex"). One real decision per question, replacing Bubblor's three identical bubbles (user feedback).

Status 2026-10-24: **done.**
- **The game:**
  - A friendly green dragon on the meadow says "Draken vill ha ett A!".
  - The child taps the right letter cookie, or drags it to the dragon, and it flies into the mouth and gets munched (`src/challenges/dragon`).
  - A wrong cookie: the dragon shakes its head, and the cookie comes back grey while the voice names it.
- **Levels:** three cookies on easy; four with look-alikes on hard, as in Task 15.
- **The child's own character,** dressed, stands on the left.
- **Bubblor** is no longer used for letters; its bubbles come back in Bygg ordet (Task 17).

#### Task 17 — Bygg ordet (spelling with bubbles)
- Bubblor turned into spelling short approved words: pop the letters in order to fill the word. Easy: the word is shown faintly; hard: only the picture and the voice. A new sign on the map.

Status 2026-10-24: **done.**
- **The game:**
  - The voice says "Bygg ordet sol!", and the word's picture is next to the speaker (tapping it says the word).
  - The child pops the bubbles with the word's letters in order; each one lands in a slot (`src/challenges/spelling`). A built word turns green and hops.
  - The words: the 17 approved words with 2–4 letters (apa, sol, ägg, öra …), five per round.
- **Help:** a letter that isn't in the word turns grey; a letter that comes later in the word stays, since it will be needed. After a wrong tap the voice says the word again and the next slot lights up; after two, the right bubble pulses. Nothing is timed.
- **Levels:**
  - Easy: the word is shown faintly in the slots, plus three extra letters, none that look like the word's letters.
  - Hard: empty slots, plus four extra letters including a look-alike (Ö next to the O in "sol"). The first word says "Nu blir det svårare! Nu syns inte ordet."
  - The same up/down rule as the other stations (Task 15).
- **On the map:** the ABC sign, left of Ord och bild, with a path to it.
- **Bubblor** is removed; its art (bubbles, meadow, the character with a wand) and layout are reused here.

#### Task 18 — Memory
- Turn over cards and match a letter with a picture that starts with it. A new sign on the map.

Status 2026-10-24: **done.**
- **The game:**
  - Cards lie face down; each pair is a picture and the letter its word starts with (`src/challenges/memory`).
  - The child turns two at a time and hears each card ("A.", "Anka.").
  - A pair stays face up and turns green, with a chime and "anka börjar på A!". Two that don't match turn back after a moment, or as soon as the next card is turned, so a tap is never lost.
  - The first time it says "Vänd på två kort. Hitta en bild och en bokstav som hör ihop!", later just "Hitta paren!".
- **Levels:**
  - Easy: three pairs, no letters that are easy to mix up.
  - Hard: four pairs, two of them with look-alike letters (A and Ä, O and Ö). It starts with "Nu blir det svårare! Fler kort, och några bokstäver är nästan lika."
- **Slips, not mistakes:** turning an unknown card is exploring. A slip is a wrong second card when the first card's partner had already been seen. Slips decide the level (the Task 15 rule) and mastery, never a reward.
- **On the map:** a sign with two cards, right of Ord och bild, with a path to it.
- **Cards turn without 3D:** only the side that shows is drawn, and it squeezes in. Playwright's WebKit can't hide the back of a 3D-turned card, so every face showed.

#### Task 19 — Make changing clothes easy to find
- The user's children couldn't find how to change their items (2026-10-24), and asked whether the wardrobe follows good practice.
- **What was wrong:**
  - The reward screen showed a new item as a picture that couldn't be tapped.
  - The way in was a small bag icon in the map's corner.
  - "Mina saker" was a wall of locked grey cards (36 of 37 at the start) with the child's own things hidden among them.

Status 2026-10-24: **done.**
- **Put it on where it is earned:** the new item on the reward screen is a card that pings. One tap puts it on: the card turns green with a tick and shows the child wearing it. Until the child has worn anything, the voice adds "Tryck på den för att ta på den!".
- **A concrete way in:**
  - The map's button shows the child's own face (head and shoulders, hat included) instead of a bag.
  - While something new hasn't been seen, a star twinkles on it and the button nods now and then.
  - Tapping the character on the map also opens "Mina saker".
- **"Mina saker" shows the child's things:**
  - Each row shows what the child owns, then only the next item to earn, which still says how to earn it when tapped.
  - Things new since the last visit have a star.
  - Putting something on or taking it off pops.
- **Saving:** save version 5 remembers how many items the child has seen. Older saves count every item as new, so the star leads the child to "Mina saker" once.

#### Task 20 — The next letters and words
- The user approved the content proposal (`docs/CONTENT_PROPOSAL.md`) on 2026-10-25: the letters R, N, T and F, and 15 words.

Status 2026-10-25: **done.**
- **Letters:** 13 instead of 9 (A F I L M N O R S T Å Ä Ö). M and N look alike: never together on the easy level; the hard level offers one on purpose. E and U still wait.
- **Words:** 43 instead of 28:
  - F: fisk, fjäril, fot, får.
  - N: näsa, nyckel, nalle.
  - R: robot, räv, raket, ros.
  - T: tåg, tand, tomat, tiger.
  - Each has its own 32×32 picture (`docs/sprites/pictures.png`). Tiger and lejon never appear together in Ord och bild.
- **Everywhere at once:**
  - All five stations use the new content.
  - Bygg ordet gets 8 more short words (räv, ros, näsa, tåg, tand, fisk, fot, får).
  - Memory never puts a picture with the letter of another name for it (the train, "lok", and an L card).
- **Speech:** 114 new sentences, with pronunciation fixes for robot, raket and tomaten (stress), tiger (said "tijer"), nyckel (a short y), and N said "enn" like M's "emm".
- **Rewards:** the mastery items take a little longer (13 letters and 43 words to master).

#### Task 21 — Prepare the ElevenLabs trial
- The user asked whether ElevenLabs can be used for free, without asking for the same audio over and over (2026-10-25).

Status 2026-10-25: **done; the trial ran with the user's go-ahead.** Listening is the user's part.
- **ElevenLabs is a second engine in `npm run speech`** (`scripts/elevenLabs.ts`, tested without network):
  - Like Piper, each clip is made once and kept; only new or changed sentences are made.
  - A clip's name includes what ElevenLabs is sent, so a Piper pronunciation fix never makes an ElevenLabs clip again.
- **Credit check:** a run never spends more than `--max-credits` or than the month has left. A full run must be given its limit; the trial allows 1000 unless told otherwise.
- **The trial:** `npm run speech -- --samples` says 10 game sentences in Matilda, Sarah and Lily (Multilingual v2), and in Matilda with Flash told the text is Swedish. Each sits next to Alma's clip on `voice-samples/index.html` (git ignores it). Trial clips are kept too, so a voice tried before costs nothing again.
- **What the run found:**
  - The user's key may only do text-to-speech: it can't list voices or read the credits left. That's fine, and the safest kind of key; the trial uses ElevenLabs' own voices by their published IDs, within `--max-credits`.
  - Charlotte (a Swedish accent) is a library voice: free accounts can't use those through the API (402, nothing charged).
  - About 805 of the 10,000 free credits were spent.
- **The user's verdict:** ElevenLabs' free voices sound like an American saying Swedish words; Lily a bit better; Alma second best despite some wrong words.
- **Next candidates, both free:**
  - Piper's Lisa, tried at Alma's pace: the user prefers Alma.
  - A native Swedish voice the user designs with ElevenLabs' Voice Design; it goes in `trialVoices` with its `voiceId`. The first prompt was blocked by ElevenLabs' Prohibited Use Policy (not charged), most likely for mentioning young children. The second, an adult narrator only, worked: the voice (`Dy9y1y6OKBLEiB4Ojgz7`) is on the trial page in Multilingual v2 and v3, for about 400 more credits (about 1,200 in all).

#### Task 22 — The game speaks with the designed Swedish voice
- The user's verdict (2026-10-25): "Designed Swedish, v3 is the absolute winner and good enough for our game", with a shorter pause before a lone letter ("Det där är ett ⎵⎵⎵⎵ N": a little pause, but less).

Status 2026-10-25: **done.**
- **The voice:** `speechVoice` is the designed voice on Eleven v3 (speed 0.85); Alma stays as `almaVoice`.
- **The pause before the target** was about 1.05–1.13 s with v3; the generator cuts its middle so it lasts 0.7 s (about three "spaces" instead of four).
- **Made once:** what ElevenLabs sends back is cached in `.tools/elevenlabs-cache`, and the 10 trial sentences were reused. All 419 clips were made for about 8,200 credits, nearly all of this month's free allowance.
- **Tidying:** some clips ended in a long silence and a click, which kept the trim from working ("Sax." lasted 2.7 s); they now end shortly after the last word. About 10 of the 81 "Var är …?", "Draken vill ha ett …!" and "Bygg ordet …!" sentences have little or no pause, because v3 didn't pause there; a retake (`src/speech/retakes.ts`) can ask for a new take.
- **Credit:** the start screen says "Röst: skapad med ElevenLabs (elevenlabs.io)", as the free plan requires.
- **Review:** every clip has a new name, so all of them are "to review" on `?review=voices`. Alma's fixes don't apply; a word the new voice says wrong needs a new kind of fix (a respelling), still to build.

#### Task 23 — More levels, set by how the child plays
- The user (2026-10-25, overnight):
  - Memory says "Nu blir det svårare" at the start of every game, which is awkward.
  - Two levels are too few. Memory should grow step by step (6 → 8 → 12 → 16 cards), and the other games too where it makes sense, but the mine keeps at most four tunnels.
  - The level should follow averages, so it doesn't flap: up for a child who keeps winning, the same or lower for one who struggles, never demotivating.
  - For Memory: compare the fewest possible turns, a typical child and random tapping.

Status 2026-10-25: **done; a local commit, not pushed.**
- **Four levels per station.** One table holds them all (`src/challenges/levels.ts`):

  | | Level 1 | Level 2 | Level 3 | Level 4 |
  |---|---|---|---|---|
  | Mata draken | 3 cookies | 4 cookies | 4, with look-alikes | 5, with look-alikes |
  | Gruvvagnen | 3 tunnels | 4 tunnels | 4, with look-alikes | the same, 7 pictures instead of 5 |
  | Ord och bild | 3 pictures, the word said | 4 pictures | the word said and written | the word only written: "Läs ordet!" |
  | Bygg ordet | the word shown faintly, 3 extra letters | the word hidden | 4 extra letters, one a look-alike | words of 4–5 letters |
  | Memory | 6 cards | 8 cards | 12 cards, with look-alikes | 16 cards |

  - On Ord och bild's top level, only 2–4-letter words are asked (the ones Bygg ordet spells).
- **Every round gets a score from 0 to 1, with guessing taken out:** 0 is no better than tapping at random, 1 is flawless.
  - Mata draken, Gruvvagnen and Ord och bild count questions answered right on the first tap.
  - Bygg ordet counts letters found on the first tap.
  - Memory counts the turns where the child had already seen the partner card: how often they found it. Turning cards they haven't seen is exploring and doesn't count.
- **The rule** (`levelRule`):
  - Up after two rounds in a row averaging at least 0.8; down after two averaging at most 0.3. Otherwise the station stays where it is.
  - The last three scores are kept, and counting starts afresh at a new level, so one lucky or unlucky round never moves a station.
  - Example, Mata draken with 3 cookies: one slip in five scores 0.7. A flawless round plus one with a slip goes up; two rounds with a slip each stay.
- **What the child hears:**
  - Going up: the round end says "Nästa gång blir det svårare." and the pips show the new level (four now).
  - The new level's sentence ("Nu blir det fler kort!") comes only on the first round there. Nothing is said at level 1, or after going down, which happens without a word.
  - 9 new sentences, 1 reworded, and "Bygg ordet …!" for the 10 five-letter words: 20 clips, about 430 ElevenLabs credits.
- **Memory, measured** with simulated players (4,000 boards per cell, average turns):

  | Cards | Fewest possible | Perfect memory | Remembers 3 in 4 | Remembers half | Random tapping |
  |---|---|---|---|---|---|
  | 6 | 3 | 4.3 | 4.5 | 4.8 | 8.9 |
  | 8 | 4 | 5.9 | 6.3 | 6.7 | 16 |
  | 12 | 6 | 9.2 | 9.7 | 10.6 | 35.5 |
  | 16 | 8 | 12.4 | 13.3 | 14.4 | 64 |

  - **Scores:** perfect memory 1.0; remembering 3 in 4 about 0.86; half about 0.72; a quarter about 0.5; random tapping 0.04–0.19.
  - **The smallest board** is the exception: random tapping scores 0.36 there, because six cards leave too few turns to tell luck from memory. It is the lowest level, so that only means an occasional early step up.
- **XP:** levels 1 and 2 give what easy and hard gave (20 and 30 the first time, then 5 and 8). Levels 3 and 4 give 8 every round, with no first-time bonus: the item pacing was tuned on two levels, and the extra XP would have brought the crown about 20 rounds sooner for a child who climbs.
- **Saving:** save version 6. Easy and hard become levels 1 and 2, with nothing announced; levels 3 and 4 are reached by playing.
- **Layout:** more than five progress circles (Memory's bigger boards, the longer ride) are drawn smaller. On an upright iPad they had run into the speaker and the picture.
- **Tests:**
  - Unit tests cover the rule, the scores (with the simulated players), every level building valid rounds and the save upgrade.
  - Browser tests open stations at a given level (`startChallengeAt`, through a saved game) and check what was said (`hasSaid`).

#### Task 24 — Playtest fixes: the missing Ä, the dragon's "no thanks", Bygg ordet's fading word
- The user, playing on 2026-10-25:
  - "Draken vill ha ett Ä" never said the Ä, not even with the speaker button. "Här är Ä!" said it fine.
  - The dragon could show that it didn't like a letter, by bursting fire or pulling a face (but not by being sick).
  - In Bygg ordet, level 1 shows the word and level 2 shows nothing. A middle ground: the word for a few seconds, then every other letter for a few seconds.

Status 2026-10-25: **done; a local commit, not pushed.**
- **The Ä:** ElevenLabs' recording of that one sentence was 1.4 s with no pause: the voice skipped the letter. Our finishing cut nothing.
  - A retake (`src/speech/retakes.ts`) made a new recording, 2.6 s with the pause and the letter after it, as loud as the rest (about 24 credits).
  - The other 90 sentences with a pause ("Var är …?", "Draken vill ha ett …!", "Bygg ordet …!") all have speech after the pause, and no clip is unusually short for its text.
- **The dragon's "no thanks":** a wrong cookie is spat back out with a puff of fire. Then the dragon pulls a face, eyes squeezed shut and tongue out, while three little puffs of smoke rise from its nose. The whole thing takes 1 second instead of 0.7. A cookie tapped meanwhile is still fed afterwards.
  - New art in `src/art/dragon.ts`: the `yuck` face, `firePuff` and `smokePuff`.
  - With reduced motion, only the face changes.
- **Bygg ordet's word fades out step by step:**

  | Level | The word in the slots | Extra letters | Words |
  |---|---|---|---|
  | 1 | shown faintly | 3 | 2–4 letters |
  | 2 | shown until 2.5 s after the voice has said it, then fades | 3 | 2–4 letters |
  | 3 | every other letter, then fades | 4, one a look-alike | 2–4 letters |
  | 4 | not shown | 4, one a look-alike | 2–5 letters |

  - **New sentences:** level 2 says "Titta noga! Snart försvinner ordet." and level 3 "Nu syns bara några bokstäver!" (about 64 credits). Level 4 keeps "Nu blir det svårare! Nu syns inte ordet."
  - **Dropped:** "Nu blir orden längre!", since the longer words now come in with level 4.
  - **Fix:** the last slot of a 5-letter word now hops in turn when the word is built.
- **Credits:** about 88 this time. The account can't report how many are left; by my count very few remain this month.

#### Task 25 — A breath after a wrong answer, and Bygg ordet says the letters
- The user (2026-10-25): in Mata draken the pause between "Det där är ett Å" and "Draken vill ha ett O" is very short; maybe half a second longer. In Bygg ordet, let the child tap a slot to hear its letter. Should a popped bubble say its letter, for right answers, wrong ones, both or neither?

Status 2026-10-25: **done; a local commit, not pushed.**
- **A breath after a wrong answer:** after naming a wrong choice, the voice waits half a second before asking again (`WRONG_PAUSE_MS`). This applies in Mata draken, Gruvvagnen and Ord och bild; `speak()` can now wait (`{ pause: ms }`).
- **Bygg ordet names the letters** (my recommendation: both right and wrong). It is information, not praise, so it fits "less talk, more sound".
  - A right bubble is named as it lands, and the last one comes with the chime and the word: "S. O. L. Sol!". The pause before the next word is 2.4 s instead of 1.7.
  - A wrong bubble is named, then the word is said again after a breath: "R. … Sol.".
  - Tapping a slot names its letter, if the slot shows it (built, or shown faintly). An empty slot says the word again, so it never gives the answer away.
- **Only taught letters as extra bubbles:** the extra letters are now among the 13 the game teaches. Before, K, P, G, D, V and others appeared as wrong bubbles.
- **New clips:** the words themselves use 11 letters the game doesn't teach yet, B D E G J K P U V X Y. Each got a clip ("K."), about 22 credits. "J." is shorter than the others (0.32 s), so it's worth a listen.

## Roadmap — later

Not scheduled. Pull an item in when it becomes the most valuable next step.

**Learning**
- Letter-sound challenge, after a dedicated TTS test ("S som i sol" as fallback).
- Initial-sound identification including tricky words (sj-, tj- and j-sounds).
- Rhyme (rim) and syllable clapping (stavelser).
- Lower-case letters.
- Letter tracing with a finger.
- Mathematics region.

**Games** (ways to answer by playing, on the same rounds; the user's picks 2026-10-23)
- **Ordbygget:** pick up letter boxes and carry them to build a short word ("Bygg ordet sol"). Spelling; needs letter sounds first (see Learning). Bygg ordet (Task 17) already spells with bubbles.
- **Mata draken:** a hungry dragon wants something that starts with a sound; drag the right picture into its mouth.
- ~~**Bubblor**~~: built as Task 13.
- ~~**Memory**~~: built as Task 18.
- **Bron:** each right answer lays a plank; a finished bridge opens a new part of the map.
- Not wanted (the user, 2026-10-23): a post delivery game, a fishing pond, a letter hunt on the map.

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
- Try ElevenLabs voices: prepared as Task 21 (the game is now about 8,100 characters); run the trial when the user says so.
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
