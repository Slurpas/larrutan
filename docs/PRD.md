# Lärrutan — Product Requirements Document

**Status:** Working baseline, revised 2026-10-22 after review (see `docs/REVIEW.md`)
**Product:** Free, Swedish-first educational pixel-art adventure
**Target age:** 5–7
**Platform:** Browser first; iPad touch is the priority device
**Name:** Lärrutan (working title). Replaces "Kunskapslandet", which is already used by an older game. A quick web search found no game called Lärrutan; no formal trademark check has been done.

## 1. Vision

A welcoming adventure world where children learn to read Swedish through short, playful challenges, exploration, and collecting things for their character.

A child aged 5–7 must be able to play **alone**: without reading, without an adult explaining, and without getting stuck. The game should work for a broad range of children, including those who benefit from predictable interfaces, explicit spoken instructions, low sensory load and extra support. It is an educational game, not a diagnostic or therapeutic product.

### Principles

1. Learning comes before engagement metrics.
2. No advertising, purchases, loot boxes or paid advantages.
3. No punishment for wrong answers, slow play or asking for help.
4. Predictable controls and immediate, supportive feedback.
5. Rewards recognise effort and progress; they can't be farmed by clicking.
6. Content is age-appropriate and approved before release.
7. Children's data stays on the device.
8. **Playable first, systems later.** Build the smallest thing a child can play, test it, then grow it. No speculative infrastructure.

## 2. Who does what

| Who | Does |
|---|---|
| Claude | All code, **all graphics**, **all audio** (generated, or sourced under a suitable licence), content drafts, tools, tests and documentation. Shows the user screenshots or sample sheets for every visual change. |
| User | Approves or rejects content, graphics and generated speech; suggests changes; tests builds on an iPad; runs playtests with a child. Does **not** create art or record audio. |
| Child (5–7) | Playtests at checkpoints. The real test of whether something works. |

No human voice recordings are planned; all speech is generated (§7). No teacher reviewer is available for now, so content quality relies on the rules in §5, Claude's drafting, the user's approval, and child playtests.

## 3. Phases and scope

### Phase 1 — Playable prototype

Goal: a child can play real Swedish literacy challenges on an iPad and walk between them.

Included:
- Three challenge types (§5): find the letter, first letter of a word, word to picture.
- Spoken instructions and words using the device's built-in Swedish voice (§7).
- A small hub map where the character walks between challenge stations (tap/click to move, keyboard).
- Immediate feedback, hints, retry, short rounds.
- XP, levels and a few unlockable items within a play session, following the reward rules (§10).
- Placeholder graphics only: simple shapes, colours and emoji. No art pipeline.

Deliberately excluded from Phase 1:
- Saving (progress resets on reload).
- Real art, character layering, asset tools.
- Generated audio files.
- Settings screens, adaptation, mastery tracking.

### Phase 2 — First real game

- Generated, approved Swedish speech stored as audio files (§7).
- Local saving and installation to the iPad home screen (§12).
- Real graphics for the world, character and stations (§9).
- Layered character with a wardrobe and the full rarity system (§9, §10).
- More content, simple mastery tracking and gentle adaptation (§6).

### Later — Roadmap

Listed in `docs/CLAUDE_TASKS.md` under *Roadmap*: more activity types, letter sounds, pets, more regions, skin tones and character creation, parent area, sound effects and music, settings, asset workshop, release review and more.

### Never

Accounts, cloud sync, multiplayer, public profiles, chat, recording children's voices, advertising, purchases, subscriptions, loot boxes, paid content, runtime AI-generated learning content, combat, time-pressure rewards.

## 4. Core loop

1. The child sees their character in the world.
2. They walk to a visible challenge station.
3. They play a short round (about 20–90 seconds, never timed).
4. Every answer gets immediate spoken and visual feedback; a wrong answer is followed by help.
5. Completing the round gives XP and may unlock an item.
6. The child returns to the world, explores, or dresses up their character.

The child can always replay the instruction, retry, and leave a challenge.

## 5. Curriculum and challenges

### Learning focus

Swedish literacy first, deliberately small:
- Recognise Swedish letters, including Å, Ä and Ö.
- Connect familiar words to their first letter.
- Connect spoken words to pictures (vocabulary).
- Later: letter sounds, initial-sound identification, rhyme, syllables (roadmap).

Start with **upper-case letters**; lower case is a later difficulty step. Mathematics is a planned expansion, not part of Phase 1 or 2.

### Challenge types (Phase 1)

| Challenge | Child hears | Child does |
|---|---|---|
| **Hitta bokstaven** (find the letter) | "Var är A?" | Taps the letter among 2–4 choices. *Since Task 16:* hears "Draken vill ha ett A!" and feeds the dragon the right letter cookie (Mata draken) |
| **Första bokstaven** (first letter) | Sees a picture, hears "sol" | Taps the letter the word starts with. *Since Task 12:* rides a mine cart (Gruvvagnen) and steers it into the tunnel with that letter |
| **Ord och bild** (word to picture) | "Var är katten?" | Taps the matching picture among 2–4 |
| **Bygg ordet** (build the word) | "Bygg ordet sol!", and sees the picture | Pops the word's letters in order from soap bubbles (Task 17). Easy shows the word faintly; hard shows only empty slots |
| **Memory** | "Hitta paren!", then each turned card ("A.", "Anka.") | Turns two cards at a time to find each picture and the letter its word starts with (Task 18). Easy: 3 pairs; hard: 4, with look-alike letters |
| **Sortera korten** (sort the cards) | "Sortera korten!", then each card picked up ("B.", "Bil.") | Moves top cards between piles until each letter lies in one pile with the pictures whose words start with it (Task 28). Level 1 shows every card; from level 2 only the top cards start face up. 3 to 7 letters |

Each challenge is a small engine fed by content data. A round is about 5 questions. Add a new challenge type only when the existing ones work well with a child.

A challenge can be played in different ways on the same rounds, speech, help and rewards (`useChoiceRound`): tapping cards, or a game where the child answers by moving, like Gruvvagnen (Task 12). Games never add time pressure: whatever moves, it waits for the child (§11).

### Content rules

Content lives in typed data files, never inside UI components. Each record has a stable ID, the learning objective, the correct answer, allowed distractors, a picture reference, the spoken text (separate from the displayed text, so pronunciation can be fixed in data), difficulty, and approval status.

Swedish-specific rules, validated by tests where possible:
1. **First sound must match first letter in early content.** Store each word's first sound separately from its spelling. Early levels only use words where they match in the simple way. Words such as *sked* (sj-sound), *kök* (tj-sound), *get*, *hjärta*, *djur* and *ljus* (j-sound) are excluded until a sound-focused challenge handles them.
2. **Vowel caution.** Short E and short Ä sound the same in most of Sweden, and O can sound like *u* (*ost*) or *å* (*olja*). Never ask children to tell these apart by sound alone.
3. **Look-alike letters are a difficulty dial.** At easy levels, never use A/Å/Ä or O/Ö (or M/N/W and similar) as distractors for each other; at harder levels use them on purpose.
4. **Picturable words only.** A word needs a picture a 5-year-old names correctly without help. If a child calls the picture something else in a playtest, the word or the picture changes.
5. **Distractors must be unambiguously wrong** and distinct from the answer.
6. **Variation without invention.** Rounds may shuffle and pick from approved content; they never invent words or answers. Rounds are seeded so a reported problem can be reproduced.

The user approves the letter and word lists. Claude presents them as a readable table (word, picture, first letter, notes) before they are used.

### Pictures

Phase 1 used emoji as placeholder pictures: no asset work, recognisable, available on every device (they look different on iPad and Windows). *Since Task 11 (2026-10-23):* every word has its own 32×32 pixel picture in the game's style (`src/art/pictures.ts`, `docs/ART_DIRECTION.md`). A new word needs its picture before it can be used; a test checks this.

## 6. Feedback and learning

Every answer gets immediate, supportive feedback, both spoken and visual (never text-only).

After a wrong answer, help is graduated:
- Name what the child tapped ("Det där är S."), grey that choice out in place, and ask again. Nothing moves.
- When only the right answer is left, point at it: highlight it and say "Här är Ä!". The child taps it to finish.
- Retry is always allowed and never penalised.
- Don't loop the same question endlessly with shuffled positions.

Attempts, hints and successes are tracked separately from rewards.

**Phase 2:** simple mastery tracking per letter and word using Leitner boxes (correct moves an item up a box, wrong moves it down, higher boxes come back less often), and gentle, reversible difficulty adaptation that changes the challenge, never the interface, and never labels the child.

**Implementation (Task 11, `src/learning/mastery.ts`):**
- **Boxes:** each challenge keeps its own boxes (1–5): letters in Hitta bokstaven, words in Första bokstaven, Ord och bild, Bygg ordet, Memory and Sortera korten.
- **Moving between boxes:** right on the first tap moves an item up one box; needing another try moves it down one box, never all the way back.
- **Choosing a round:** questions are picked in a weighted random order, and each box comes up about half as often as the one below. Items still being learned dominate, but known items still come back.
- **New players:** everything is in box 1, so they get exactly the same seeded rounds as before mastery existed.
- **Look-alike levels:** they still ask about the look-alike letters; mastery only changes their order.
- **Saving and visibility:** boxes are saved with the progress (since save version 2) and never shown to the child.
- **Levels (Task 23, replacing Task 15's easy and hard):**
  - **Four per station,** each harder in a way the child can notice: more choices or cards, look-alikes, the word written (and then only written), the word to build fading away step by step, a longer ride. The table is `src/challenges/levels.ts` (summed up in `docs/CLAUDE_TASKS.md`, Task 23).
  - **Every round gets a score** from 0 (no better than guessing) to 1 (flawless): answers right on the first tap in the choice games, letters found on the first tap in Bygg ordet, in Memory how often the child found a partner card they had already seen, and in Sortera korten how often a card put on another card was allowed there.
  - **Up** after two rounds in a row averaging at least 0.8, and the end of the round says so ("Nästa gång blir det svårare."). **Down** after two averaging at most 0.3, without a word. Otherwise the station stays, so one lucky or unlucky round never moves it.
  - **The new level's sentence** ("Nu blir det fler kort!") is said once, on the first round there. The level pips show the level.
  - **Saved** per station, with the last three scores (save version 6).

## 7. Voice and audio

Spoken instructions are essential because most players can't read. No human recordings are planned; all speech is generated.

### Stage 1 — Prototype: the device's built-in voice (replaced 2026-10-22)

The first prototype used the browser's built-in Swedish voice (Web Speech API). This proved unreliable: Brave and Firefox on an English Windows have no Swedish voice at all, and iPad Safari lists its voices late. The device voice is now only a fallback for a sentence without a clip, or a clip that won't play. If neither works, the game shows a visible warning instead of speaking another language.

### Stage 2 — Generated audio files (started early, 2026-10-22)

A script (`npm run speech`) generates every needed clip from the content data, once, at build time. The files are stored in the project; the game never calls a speech service while a child plays. A test fails if any sentence the game can say has no clip.

Current voice (since 2026-10-25): **ElevenLabs Eleven v3** with a voice the user designed with ElevenLabs' Voice Design, from a description of an adult native Swedish narrator. It clearly won a listening trial (`npm run speech -- --samples`) against Alma and ElevenLabs' own voices, which sounded American. The free plan gives 10,000 characters a month (the game is about 8,300), for non-commercial use, with "elevenlabs.io" credited on the start screen. v3 paused about a second before the target; the generator shortens that pause to 0.7 s (the user: a little pause, but less). What ElevenLabs sends back is cached outside git, so each sentence is paid for once. Alma (Piper, offline) is kept as `almaVoice` to switch back to.

Until 2026-10-25: **Piper** (free, offline, no account) with the female Swedish voice "Alma" (`sv_SE-alma-medium`, CC BY 4.0, credit required), slowed for young listeners (length scale 1.4, picked by ear on 2026-10-23). "Var är …?" questions have a short pause, about 0.4 s, before what the child must find ("Var är … Å?"), so the target stands out. Still to do in Task 6: compare it by ear with other engines. Gemini TTS (free tier, no card) was sampled on 2026-10-23; Azure and Google need a card and were dropped.

Long instructions are said only until the child knows the game: Första bokstaven says "Vilken bokstav börjar sol på?" for the very first picture, then just the word ("Öra."), also after a wrong tap and when the picture is tapped. The speaker button always gives the full question. Words the engine mispronounces are fixed in a pronunciation list (`src/content/pronunciation.ts`).

Praise and celebrations are short sound effects rather than words: a chime for a right answer, a fanfare at the end of a round, and a sparkle before "Du har gått upp en nivå!" or "Du fick en keps!".

- **Candidates without a credit card** (the user won't enter card details anywhere): ElevenLabs' free plan (chosen, see above), Piper (offline, no account) and Gemini TTS (free tier with a Google account: 3 requests a minute, 10 a day; its free-tier content may be used by Google to improve its products, which is only our game's sentences). Azure and Google Cloud TTS need a card and are out.
- The user creates any provider account and puts the key in a local `.env` file that is never committed. Claude never types or handles the key.
- Before choosing, Claude generates the same sample sentences with each candidate and the user picks by ear.

### Approval

Every generated clip has an approval status. The user listens on a simple review page and approves or rejects. Rejected clips are regenerated with a changed spelling, a phonetic override or another voice. Release builds only contain approved clips, and a check flags missing or unapproved required audio.

**Implementation (Task 6):**
- **Review page:** open the game on the dev server with `?review=voices`.
- **Grouping:** clips are listed per letter, per word, and one group for the map and rewards.
- **Reviewing:** each clip is marked Good or Wrong, with a note saying what's wrong. It works with keys on a PC and with large buttons on the iPad.
- **Where decisions are saved:** `src/speech/audio/sv/approvals.json`, through a dev-server-only endpoint. The hosted game can't change anything.
- **File names:** a clip's name hashes its text, its pronunciation fix and the voice settings (`src/speech/voiceSettings.ts`). A fixed or re-voiced clip gets a new name, so it is automatically unreviewed again, and no browser can play a cached old version.
- **Status report:** `npm run speech` prints how many clips are approved, rejected or not yet reviewed, and lists the rejected ones with their notes.
- **Not yet enforced:** release builds aren't limited to approved clips yet. Leaving a clip out would make the game silent there in browsers without a Swedish voice. It is enforced at the release review, when all clips are approved.

### Letter names, words and letter sounds

- **Letter names** ("A", or "K" said as "kå") and **whole words** ("kök") are reliable with good TTS voices.
- **Isolated letter sounds** ("sss", "mmm", a short "k") are unreliable in every TTS engine. Phases 1 and 2 avoid them. The roadmap's letter-sound challenge starts only after a dedicated test; letters whose sound can't be generated acceptably are taught as "S som i sol" instead.

### Sound effects and music

Sound effects are synthesised by code (`npm run sfx`), quieter than speech. Music (roadmap): CC0 sources or simple generated loops, quiet or off by default. Speech, effects and music each get their own volume setting (roadmap).

## 8. World and controls

A scrolling top-down world with a following camera that never shows space outside the map.

- **Tap/click to move** is the main control. Tapping a spot walks there; tapping a station walks there and opens it.
- **Keyboard:** arrow keys and WASD; Enter/Space opens a nearby station.
- Virtual joystick: roadmap, optional, off by default.
- Movement is forgiving; reaching a challenge never needs precise navigation.
- Map layout lives in data (text grids), separate from movement code.

Phase 1 has one small hub with the three stations and a few things to look at. Since Task 27 the blue house is the child's home: tap it to walk in, to a room with a wardrobe (to change clothes) and a mirror; at the red house nobody answers the knock (the user's child asked why they couldn't go into the houses). All stations are visible from the start position on an iPad, so a child who hears "Tryck på en skylt" can see one straight away; the rest of the map is there to explore. Further regions appear as visible locked places once there is a second region worth building.

Orientation: landscape first; in portrait, show a picture hint to rotate the iPad.

## 9. Graphics

### Ownership

Claude produces or sources **all** graphics and integrates them. Sources:
1. **Code-generated pixel art** from reproducible scripts (sprites as text grids, one fixed palette, recolour variants).
2. **Free assets with a clear licence**, preferably CC0 (public domain), such as Kenney's packs. Every external asset is logged with source and licence in `docs/ASSET_LICENSES.md`.

Claude picks whatever mix looks best. For every visual change Claude shows the user screenshots or sample sheets; the user approves or asks for changes.

### Phase 1: placeholders

Simple shapes, flat colours and emoji only. No art pipeline and no asset tooling.

### Phase 2: art direction

Before real art there is one comparison of candidate styles (for example 16×16 vs 32×32 tiles, own vs CC0 environment), shown side by side at iPad and desktop size. The user picks; the decision goes in `docs/ART_DIRECTION.md`. **Decided 2026-10-23: 16×16 pixel art** with a 16×32 chibi character and the soft UI kept, because that is where the most clothes and items will actually get made. Rules and palette are in `docs/ART_DIRECTION.md`.

Pixel art is displayed at integer scale. Letters for learning use a clear literacy font (Andika, SIL Open Font License), not a pixel font.

### Character and items (Phase 2)

- One base character with a single default skin tone for now. Skin tones and character creation are on the roadmap.
- Items are layered on the base character. Each slot holds one item; equipping another item in the same slot replaces it. Start with a few slots (for example headwear, top, bottoms, back item, held item) and add more when needed.
- Slot and drawing order are separate concepts: a cape is drawn behind the body, a hat over the hair.
- Body-covering clothes are generated from body masks so they fit every direction and walk frame automatically. Attached items (hats, backpacks) use anchor points. *Built (Task 10):* one point per facing, because the walk frames only move the legs; per-frame points can come if a frame ever moves the head.
- Three directions are drawn (down, up, side); the other side is mirrored.
- One character renderer is used everywhere the character appears: world, wardrobe, reward pop-ups.
- A new item is added through art plus a data entry, without renderer code changes.

## 10. Rewards and progression

Three separate things:
1. **Answer feedback:** immediate, on every answer.
2. **Learning progress:** what the child knows (Phase 2).
3. **Rewards:** XP, levels and items.

### XP rules

- No XP for clicks, single answers, or retrying an answer.
- XP is given for **completed rounds**.
- The **first completion** of a challenge level gives full XP. **Replays** give reduced XP (starting point: about a quarter), so practice is still worth something but the first success counts most.
- Hints and wrong answers along the way don't reduce the reward. "First completion" means finishing the round, not finishing without mistakes.
- Milestones and unlocks are granted **exactly once**, even if events repeat or the page reloads.
- No daily-streak pressure: any "days played" goal counts total days, never consecutive days.
- All numbers live in one config file and are tuned after playtests.

XP is shown as a filling bar and levels as a visible celebration, not as numbers a child must read.

### Rarity: bragging rights

Five tiers, cosmetic only, shown as **1–5 stars plus colour** (never colour alone):

| Tier | Swedish | Typical time to earn |
|---|---|---|
| Common | Vanlig | First play session |
| Uncommon | Ovanlig | First few sessions |
| Rare | Sällsynt | About a week of regular play |
| Epic | Episk | Several weeks |
| Legendary | Legendarisk | Long-term goals, e.g. every letter mastered, every station finished at its hardest level, every secret found |

Golden hats and dragon pets are **bragging items** and must never appear in the first minutes. High tiers are earned through effort over time and real progress. They are never random, never bought, and never require error-free play: a child who needs more hints gets there later, not never.

Locked items are visible with their stars and a friendly spoken explanation of how to earn them. In "Mina saker" each row shows the child's own things and the next item to earn; the rest appear as they come closer (Task 19, 2026-10-24: a wall of locked cards hid the child's own things). No countdowns, scarcity pressure or manipulative prompts.

**Changing clothes (Task 19):** children must find it without reading.
- **On the reward screen,** a new item is put on with one tap. Until the child has worn anything, the voice says that a tap does it.
- **On the map,** the button to "Mina saker" shows the child's own face. A star marks items the child hasn't seen yet, and tapping the character also opens "Mina saker".
- **In "Mina saker",** new items have a star.

Phase 1 tests the rules with a few placeholder items (emoji). Phase 2 adds the real catalogue.

**Phase 1 implementation (Task 5):** easy XP 20, hard XP 30, replays a quarter; levels at 30, 70, 120, 180 XP. Hitta bokstaven and Första bokstaven have an easy and a hard level (hard offers exactly one look-alike of the answer); a sign opens the first level not yet completed. Five emoji hats, one per rarity (replaced by the wardrobe in Task 10). Progress is saved on the device since Task 7 (§12).

**Four station levels (Task 23):** levels 1 and 2 give what easy and hard gave (20 and 30 the first time, then 5 and 8). Levels 3 and 4 give 8 every round, with no first-time bonus, so a child who climbs doesn't reach the rare and legendary items sooner.

**Wardrobe (Task 10, bigger in Task 14):** pixel-art items in five slots. A round gives **at most one item**: in every round for a new player (rounds 1–6), then every other round (8–32), then every third (from 34) (user feedback 2026-10-24 and 2026-10-25: more at first, then a bit harder). When more are earned they wait, in the order of the list below. Level 2 can be finished in the first session, so it gives uncommon items, not rare ones.

| Tier | Items and how they are earned |
|---|---|
| Vanlig | keps (first round), blå tröja, gröna byxor, mössa (level 1 of Hitta bokstaven, Första bokstaven and Ord och bild), blomma (3 rounds), röd keps (5), gul tröja (7) |
| Ovanlig | rosett (level 3), randig tröja and ballong (level 2 of Hitta bokstaven and Första bokstaven), ryggsäck (10 rounds), rosa tröja (12), grön keps (level 4), partyhatt (level 5), blå ballong (15), röda byxor (18), solros (20) |
| Sällsynt | hög hatt (level 6), mantel (25 rounds), stjärntröja (level 7), grön mantel (30), trollstav (35), vikingahjälm (level 8), grönrandig tröja (40), röd ryggsäck (45), gula byxor (50) |
| Episk | studentmössa (level 9), vingar (60 rounds), regnbågsbyxor (every letter of Hitta bokstaven in the top mastery box), pirathatt (65), fjärilsvingar (80), kockmössa (90), stjärnbyxor (every word of Ord och bild in the top box) |
| Legendarisk | krona (level 10), guldmantel (every word of Första bokstaven in the top box), guldvingar (level 13), regnbågsmantel (150 rounds) |

Unit tests play rounds and check the timing: at most uncommon after a first session, rare by 40 rounds, nothing epic at 50, the crown between 70 and 100 rounds, never more than one item per round and never two rounds in a row. The mastery items depend on how well and how often the child plays; with 13 letters, the rainbow trousers need at least 11 perfect rounds of Hitta bokstaven.

## 11. Accessibility

Phase 1:
- No timers and no speed requirements.
- Every instruction can be replayed with a big speaker button that is always in the same place.
- Large touch targets (at least about 64 px on iPad) with generous spacing.
- Stable layout: essential buttons never move.
- No reliance on colour alone.
- Navigation works without reading.
- Keyboard support.
- A clear exit from every challenge.

Later: reduced motion (respecting `prefers-reduced-motion`), separate volume settings, an optional gentle re-prompt when the child is idle, a high-contrast option.

## 12. Saving and privacy (Phase 2)

- Local saving (IndexedDB), versioned from the first version, with migration tests and safe recovery from broken or old saves.
- Saved data: XP, level, completed challenge levels, granted milestones, unlocked and equipped items, learning progress, settings.
- One local profile, but the data model must not assume there will only ever be one.
- **iPad storage risk:** Safari may delete a website's stored data after 7 days of browser use without visiting it, unless the site is added to the Home Screen. The game is therefore installable as a PWA (home-screen icon, offline, full screen) and requests persistent storage where supported. This needs HTTPS hosting. Save export/import is on the roadmap.
- No accounts, no analytics, no personal information. Never ask for the child's name.
- Before any public release: review child privacy, dependency licences, asset and font licences, and the TTS provider's terms for distributing generated audio.

**Implementation (Task 7):**
- One IndexedDB database `larrutan` with a `profiles` store keyed by profile id (only `default` for now) and a `backups` store.
- The save is `{ version: 1, savedAt, progress }`. The round ledger is not saved; it only stops a double event within one session.
- Every field is checked when loading. A broken field is reset on its own, and the rest is kept.
- A save that needed repair is first copied to `backups`.
- A save from a newer game version is played but never overwritten.
- Nothing is written before the save has been read. If IndexedDB is slow or stuck (it can hang in Safari), the game plays without saving rather than risk overwriting real progress.
- The first upgrade step, with its test, comes with the first change to the saved shape (`src/persistence/saveFile.ts`).
- PWA: a manifest, icons, iPad home-screen meta tags and a hand-written service worker (`src/pwa/serviceWorker.js`). A build plugin in `vite.config.ts` fills in the list of every file in the build.
- The whole game, voice included, is cached on the first visit and plays offline. Audio range requests are answered with 206, which Safari needs.
- A new version takes over on the next start, never mid-round.
- Persistent storage is requested only in the installed app, so no browser can show a question a child can't answer.
- The site has `noindex` until the release review.
- Hosting: GitHub Pages at https://slurpas.github.io/larrutan/. It deploys on every push to `main` (lint, unit tests and the build must pass), and the repository is public.
- The start screen shows the voice credit (CC BY) and, in release builds, the build time, so it's easy to tell which version an iPad has.

## 13. Technical architecture

- **TypeScript + React + Vite** for the app shell, challenges and menus. The DOM handles big buttons, keyboard focus, accessibility and fonts well.
- **Phaser** for the world map, movement and camera, from the hub task onward.
- **Vitest** for logic tests; **Playwright** for a few browser tests, run in WebKit as well as Chromium (WebKit is the closest stand-in for iPad Safari).
- No backend.
- Folders grow with the work. Start with only what Phase 1 needs (for example `app`, `challenges`, `content`, `speech`, `world`, `rewards`) and add `persistence`, `character`, `assets` and so on when their phase starts. No generic engine, no speculative abstraction.
- Image and audio scripts use pure-JavaScript libraries (no native modules) to avoid Windows build problems.
- iPad: disable double-tap zoom, pinch zoom, text selection and long-press menus inside the game. Start audio on the first tap. Verify on a real iPad that speech plays with the silent switch on.

## 14. Quality and definition of done

A task is done when:
- It works in the browser, verified by Claude with screenshots at desktop and iPad sizes, and the user has a short list of what to check on the iPad.
- Logic with real consequences has focused tests: content validation, round generation, reward rules (no farming, exactly-once unlocks), and later saving and migration.
- Type check, lint and build pass.
- Docs are updated when a decision changes.
- There are no unrelated rewrites and no unrequested dependencies.

Tests are proportionate: test the rules that would hurt a child if they were wrong, and don't build test infrastructure for its own sake.

## 15. Known risks

| Risk | Mitigation |
|---|---|
| Built-in browser voices differ between devices | Prototype only; Phase 2 moves to generated, approved files |
| TTS can't produce isolated letter sounds | Avoided in Phases 1–2; "S som i sol" fallback |
| The silent switch mutes audio on iPad | Test on the device; show a picture hint to turn sound on |
| Safari deletes data for unused websites | PWA install, persistent storage request, later export/import |
| Emoji look different per device; new emoji may be missing | Resolved in Task 11: our own pixel pictures, the same on every device |
| No teacher reviews content | Strict content rules, user approval, child playtests |
| Generated art looks amateurish | Style comparison before committing; CC0 packs as fallback |
