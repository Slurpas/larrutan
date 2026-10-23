# Review of PRD.md and CLAUDE_TASKS.md

*Reviewed 2026-10-22 by Claude. This file is kept as a record. `PRD.md` and `CLAUDE_TASKS.md` have since been rewritten based on it and on the decisions below.*

## Decisions taken after the review (2026-10-22)

- **Name:** Lärrutan. "Kunskapslandet" is taken by an older game.
- **Voice:** no human recordings at all. Phase 1 uses the device's built-in Swedish voice; Phase 2 generates audio files at build time with a TTS service (Azure recommended, compared against Google and Piper), and the user approves clips by ear. The recording booth proposed in §2 is dropped.
- **Content review:** no teacher is available; the user approves content, backed by strict content rules and child playtests.
- **Graphics:** the user reviews and approves visuals but creates none. Claude may generate art or use properly licensed assets (e.g. CC0), whichever looks best.
- **Build order:** playable challenges first. Phase 1 has no art pipeline and no saving.
- **Rewards:** replays give reduced XP, the first completion gives the most. High-rarity items are long-term "bragging" items, earned through effort and progress over time, never in the first minutes.
- **Deferred to the roadmap:** skin tones and character creation, parent area and parent gate, settings screen, sound effects and music, pets, asset workshop.
- The original 10-task order in §7 is superseded by the phase plan in `CLAUDE_TASKS.md`.

## Later decisions

- **2026-10-23: hosting is GitHub Pages.** The game is published at https://slurpas.github.io/larrutan/ and deploys on every push to `main`. The repository is public. Before the first push, all commit emails were rewritten to GitHub's no-reply address, which is also used from now on. Cloudflare Pages was the alternative; it keeps the code private but needs a new account.
- **2026-10-23: the voice speed is length scale 1.4,** picked by ear from three samples. "Var är …?" questions pause about 0.4 s before the target.
- **2026-10-23: the art style is 16×16 pixel art** (`docs/ART_DIRECTION.md`). The user's criterion was where Claude will practically produce the most clothes, items and options. Soft vector was Claude's first recommendation, for its match with the UI. Pixel 32×32 was the middle option.
- **2026-10-23: downloads approved.** Kenney's Tiny Town (CC0) is used for scenery, and the Andika font (SIL OFL) for letters. Both are logged in `docs/ASSET_LICENSES.md`.
- The other open decisions from the night of 2026-10-23 are in `docs/OVERNIGHT_NOTES.md` until they're settled.

## Verdict

The two documents are **strong on values and weak on logistics**.

The values are excellent and I would keep almost all of them: no dark patterns, no punishment, reviewed content instead of AI-invented questions, idempotent rewards, local-only data, accessibility from day one, "stop for review after each task". The PRD and the task plan map onto each other one-to-one, and the acceptance criteria are concrete and testable. That is better than most game specs.

The weaknesses have a single root cause: the documents read as if a team already exists — an artist, a voice actor, a literacy reviewer and an existing codebase. In reality it is you and me, an empty folder, and you can't do any visual work. Put that reality next to the docs and these problems appear:

1. **Audio is the real critical path, and no task produces it.** For a 5-year-old who can't read, the voice *is* the user interface. The docs require "reviewed Swedish recordings" in many places but never say who records them or how.
2. **"Reviewed" content has no reviewer.** Every content record has a review status, but nobody is named to approve anything.
3. **The build order is horizontal.** The first time a child can play a complete learning loop is around Task 008–010. A lot could be built before anyone learns whether the core loop is fun or teaches anything.
4. **Ordering bugs.** Tasks 006–008 depend on things built in later tasks (audio playback, persistence), and the PRD's "technical foundation" step has no task.
5. **Unresolved design tensions**: rarity versus learning ability, "no XP farming" versus "practice is good", and whether hints cost rewards.
6. **Missing pieces**: the base character's identity (skin tone, hair), a parent gate, iPad storage eviction, picture cards for words, sound effects and music, and Swedish-specific phonics rules.

None of this is fatal. Most of it is fixed by (a) naming who does what, (b) reordering into a thin playable slice first, and (c) adding a handful of rules. Details below, then a proposed revised task plan.

---

## 1. Graphics: how "Claude does all the art" actually works

This is your biggest concern, so here is a straight answer.

### What I can and can't do

- I **don't paint images**, and I have no image generator. I write code that *produces* images (PNG files) pixel by pixel from data and rules.
- I **can see images**. I can open the PNGs I generate and screenshots of the running game and judge them. So I work in a loop: generate → look → fix → look again. This is the most important fact for the whole pipeline: the preview tools should be built for *me* to look at first and for you second.
- **Good at**: consistent tiles and terrain, palettes, UI elements and icons, simple chunky characters, recolour variants, anything with rules and structure.
- **Harder**: expressive faces at high resolution, organic detailed illustration, complex fluid animation. A skilled human pixel artist will beat me there.

Realistic expectation: clean, consistent, readable and charming in a simple way (think Game Boy Color / early Pokémon), not a Stardew Valley-level showcase. The art style should be *chosen* to play to these strengths instead of fighting them.

### Recommended pipeline

1. **One fixed palette** (about 24–32 colours) for everything. This alone makes generated art look like it belongs together.
2. **Sprites authored as text grids** in code, one character per pixel mapped to a palette colour. Easy for me to write, diff and fix, and fully reproducible.
3. **Mask-based clothing** — the key trick for the wardrobe. Clothes that cover the body (tops, outerwear, bottoms, shoes) are not hand-drawn per frame. The base body has a region mask per frame (torso, arms, legs, feet). A shirt is defined as "fill the torso and arm regions with this colour/pattern, add an outline". The generator then produces that shirt for *every* direction and walk frame, guaranteed to line up. One shirt shape plus ten palettes gives ten shirts.
4. **Anchor points for attached items.** Hats, glasses, backpacks and held items are drawn once per direction and positioned with per-frame anchor points (head, back, hand). A hat isn't redrawn for each walk frame; it follows the head anchor as the body bobs.
5. **Three drawn directions, not four**: down, up and side, with the other side mirrored. Standard practice that cuts the art work by 25%. Asymmetric items get a flag so mirroring doesn't break them.
6. **Short walk cycles** (2–4 frames): enough to feel alive, small enough to keep every item aligned.
7. **Maps written as text** (ASCII grids with a legend), turned into tilemaps by a script with automatic edge and transition tiles (autotiling). No map editor — map editors are visual tools, which is exactly what we're avoiding.
8. **A contact-sheet command**: one script that renders every sprite, direction, frame and outfit combination into labelled PNG sheets at integer zoom. I open these directly without a browser. The browser workshop is still useful, but the contact sheet is the fast inner loop.
9. **Pure-JavaScript image tooling** (e.g. `pngjs`), no native modules, so nothing breaks on Windows or on the `ä` in the folder path.
10. **Generated PNGs are committed**, and a test regenerates them and checks the output is byte-identical. "Reproducible" becomes something we test, not something we hope for.

### Resolution (Task 002): my prior

Keep the comparison; it's cheap and worth doing. But my expectation going in is that **16×16 tiles with a chibi character of about 16×32 (big head)** will win:

- On screen both options are the same physical size (16 px at 4× zoom = 32 px at 2× zoom). The only difference is detail per tile versus work per asset.
- Every wardrobe item multiplies work by directions × frames. At 32 px that is about 4× the pixels for every item, forever.
- Chunky pixels read better for small children on an iPad.
- The wardrobe and profile can show the same sprite at a larger integer zoom, so detail is visible where it matters.

If a 16 px-wide character can't show a face clearly, the fallback is a slightly larger character canvas (e.g. 24×32) on 16 px tiles, not doubling everything.

### Fallback for the environment: free CC0 packs

For the **character and wardrobe**, code-generated is the only real option; no ready-made pack fits a custom layered system. For the **environment** (grass, trees, houses, water) there are good public-domain (CC0) pixel-art packs, the best known being Kenney's (kenney.nl). Recommendation: I make the environment myself first. If the Task 002 comparison shows my terrain isn't good enough, we switch the environment to a CC0 pack and I match the character palette to it. The PRD already allows this with approval and a documented licence.

### Full asset inventory (the docs only cover part of it)

| Asset class | In the docs? | How it gets made | Who signs off |
|---|---|---|---|
| Terrain, tiles, landmarks | Yes | Code-generated (CC0 fallback) | Claude, then you |
| Base character + animation | Yes | Code-generated | Claude, then you |
| Wardrobe items, pet | Yes | Code-generated (masks + anchors) | Claude, then you |
| UI: buttons, panels, icons | Partly ("UI icons") | Code-generated | Claude, then you |
| **Picture cards for words** (äpple, älg, ö …) | **No task makes them** | Code-generated, larger (e.g. 32–48 px) | **A child** (see §2) |
| **Guide character** who speaks instructions | **Missing** | Code-generated | You |
| **Letter font** | **Missing** | Licensed font: Andika (SIL Open Font License, made for beginning readers) | You |
| **Sound effects** | Mentioned, **no task** | Code-generated (sfxr-style synthesis) | You |
| **Music** | Mentioned, **no task** | CC0 pack or simple generated loops; quiet/off by default | You |
| **Voice: instructions, feedback** | Required, **no task** | Your recordings, or build-time text-to-speech | You |
| **Voice: letter sounds (phonics)** | Required, **no task** | **Human recording strongly preferred** | You (+ a teacher if possible) |

---

## 2. The biggest gap: audio, and who "reviews"

### Why audio is the critical path

Most 5–7-year-olds can't read yet. Every instruction ("Vilken bokstav säger *sss*?"), every word and every piece of feedback must be spoken. Without audio the game isn't weaker — it doesn't work. Yet:

- The PRD requires reviewed local Swedish recordings and bans runtime third-party speech synthesis (a good rule).
- Task 006 needs "approved audio" for its letter/sound activity.
- Task 007 adds audio playback.
- **No task records, generates, processes or reviews a single sound file.**

Voice is the one asset class I can't produce well on my own. Options:

| Option | Instructions & feedback | Letter sounds (phonics) | Notes |
|---|---|---|---|
| **A. You record everything** (recommended if possible) | Yes | Yes | Best quality for phonics. Your voice ships in the game. |
| B. Build-time TTS for instructions, you record phonics | Yes (e.g. Azure, Google or the open-source Piper) | Yes, you | Generated once and stored as files, so it's allowed by the PRD (not a *runtime* dependency). Check the TTS terms of use. |
| C. TTS for everything | Yes | **No** | TTS is bad at isolated sounds ("sss", "mmm") and tends to say letter *names*. Not acceptable for phonics. |

**Recording is very doable.** For the MVP I estimate roughly 150–300 short clips (letter names, letter sounds, 60–100 words, instructions, feedback variations, guide lines). With a good tool that's one or two sessions of about an hour, using any decent headset or phone mic in a quiet room.

**What I'd build: a recording booth** in the dev tool. It lists every needed clip (generated from the content data, so nothing is forgotten), shows the text, you press a key, speak, press a key. It trims silence, evens out loudness across clips, saves the file and fills in the metadata. Missing clips show up red. You never open an audio editor.

Before you've recorded anything, dev builds can use the browser's built-in voice as a **placeholder, dev builds only**, clearly flagged as unreviewed. That unblocks development without breaking the "never substitute an unreviewed phoneme" rule in a real build.

### Roles: the docs need to state these

| Role | Who | Does what |
|---|---|---|
| Builder | Claude | All code, all images, sound effects, tools, tests, and drafts of all content |
| Content reviewer | You (+ a teacher if you know one) | Approves words, pictures and letter sounds via approve/reject buttons in the dev tool |
| Voice | You (or someone you ask) | Records clips in the recording booth |
| Device tester | You | Tries each reviewed build on a real iPad |
| Playtester | A child aged 5–7 | The real test. Fifteen minutes watching one child play the first slice is worth more than any amount of review |

So the dev tool should be one **Studio** with three parts:

- **Assets**: sprites and outfits, mainly for me.
- **Content**: word + picture + sound cards with Approve/Reject buttons that write the review status back into the data files.
- **Recording booth**.

Your whole contribution becomes clicking Approve, speaking, testing on the iPad, and watching a child play. No visual creation.

A cheap, powerful picture test: show a picture card to a child and ask "Vad är det här?". If they don't say the intended word, the card fails, however nice it looks. In word-to-picture and initial-sound activities an unrecognisable picture breaks the learning, not just the looks.

---

## 3. Inconsistencies in and between the documents

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | PRD header vs §4 | Target age "5–7" vs "rather than claiming complete coverage of ages 4–8" | Use 5–7 throughout |
| 2 | Folder vs docs | Folder is `Lärrutan`, docs say `Kunskapslandet` | Pick one working title |
| 3 | PRD §13 step 2 vs tasks | PRD has "build a technical foundation"; **no task does it**. Task 001 forbids building, and Task 002 already needs a running app to preview at iPad sizes | Add a setup/foundation task |
| 4 | Task 001 | Written for auditing an *existing* repo ("preserve working code"). The project is empty and **isn't a git repository** | Replace with a setup task; `git init` first |
| 5 | Task 006 vs 007 | 006 needs approved audio for the letter/sound activity; playback arrives in 007, and recording is never planned | Audio pipeline before or alongside the first activity |
| 6 | Tasks 007/008 vs 009 | 007 requires "settings persist locally", 008 "unlocks survive reload", but versioned persistence is built in 009. Either 007/008 fail acceptance or they build throwaway storage that 009 replaces | Small versioned save layer in the foundation, extended per task |
| 7 | PRD §11 `ui` module | Mentions an "adult-facing progress summary" that is specified nowhere and built by no task | Specify a minimal parent area (§4.8) |
| 8 | PRD §12 | "Å, Ä, Ö survive … sorting", but the game has no sorting feature | Say where: alphabet chart and parent view, using Swedish collation (`Intl.Collator('sv')`, Å Ä Ö after Z) |
| 9 | PRD §8 vs Task 008 | "Do not equate rarity with learning ability", but if legendary items come from learning milestones, rarity *does* follow ability | §4.2 |
| 10 | PRD §12 | "Retrying an activity cannot farm XP" mixes *retrying an answer* (should give nothing) with *replaying a round* (that's practice, which is good) | §4.2 |
| 11 | `CLAUDE_TASKS.md` | Full of escaped markdown (`\#`, `\-`, `&#x20;`), as if pasted through a rich-text editor. Renders badly | Clean up |
| 12 | Where the rules live | "Instructions applying to every task" sit in `docs/`, which Claude Code doesn't load automatically | Move them into a root `CLAUDE.md`, loaded every session |

---

## 4. Design decisions worth rethinking

### 4.1 Build a thin playable slice first

The plan builds in layers: art → asset pipeline → renderer → world → content → feedback → rewards → saving → integration. Risk: lots of polished infrastructure around a core loop nobody has tested. For a kids' game the questions that matter most are: *does a 5-year-old understand what to do without help, want to continue, and learn something?* You only find that out by watching a child play, so get there early.

Recommendation: after setup and the art decision, build **one complete thin loop**: a one-screen map, the base character, tap-to-move, one station, one activity (letter recognition with about six letters including Å, Ä, Ö), placeholder voice, one reward (a hat) granted exactly once, a tiny wardrobe to wear it, save and reload. Playtest. Then widen each part. Roughly the same total work, much lower risk. The PRD's "coherent slice, not a movement prototype" is the right goal; this gets there first instead of last.

### 4.2 Rewards: resolve three tensions

1. **Rarity vs ability.** If epic/legendary items require mastery, a child who struggles never gets them, which is exactly what the PRD says it doesn't want. **Proposal:** high-rarity items come from *effort and time*: rounds completed (with or without hints), days played, places discovered. Mastery milestones give stickers, not better items. Every child who keeps playing eventually unlocks everything.
2. **Farming vs practice.** Replaying a completed round *is* practice, the whole point of the game. **Proposal:** no XP for clicks or answer attempts (as the PRD says); XP for each *completed round*, every time; once-only applies to milestones and unlocks; idempotency means "the same completion event is never counted twice", not "one reward per activity, ever". Optionally a little extra XP for content that's due for review, so rewards nudge toward good practice.
3. **Hints.** The PRD says asking for help is never punished, but not whether hints reduce rewards. **Proposal:** state it: a round completed with hints gives the same reward. Hints affect the *learning* record (mastery), never the *reward* record.

### 4.3 Presenting progress to a 5-year-old

- "XP 1240" means nothing at this age. Show XP as a filling bar or a growing thing (a tree, a jar of stars), and levels as a visible change.
- Show rarity as **1–5 stars plus colour**. That also satisfies "no reliance on colour alone" and avoids reading words like "Legendarisk".
- Present achievements as a **sticker album** (klistermärken). Instantly understood, no reading.

### 4.4 The base character's identity is missing

The PRD covers cosmetic *items* but not who the character *is*. Children want a character that looks like them. **Proposal:**

- First launch: a short, picture-only "create your character": skin tone, hairstyle, hair colour, eye colour. No gender labels.
- These are always free and changeable: never locked, never rarity-tagged. Unlockables are clothes, accessories and pets.
- Don't ask for the child's real name (fits the PRD's privacy rules).
- With palette-based sprites, skin and hair variants cost almost nothing to produce.

### 4.5 Fewer slots in the MVP

Thirteen slots is a lot, and at 16 px some (face markings, mouth accessories) are 1–3 pixels. "Mouth accessories" also has awkward options for kids. **MVP proposal:** hair (free), headwear, face accessory (glasses etc.), top, outerwear, bottoms, footwear, back item, held item, pet. Keep the data model open for the rest; the PRD already allows refining slots after the prototype.

### 4.6 Add a guide character

A friendly character (an owl, a fox, a moose …) who speaks every instruction and piece of feedback. For non-readers it gives the voice a face, makes "who is talking, where do I look" obvious, and gives stations personality. If the child does nothing for a while, the guide can gently repeat the question (configurable, never a countdown). Cheap to make, big impact.

### 4.7 Define "stations" and "discoveries"

- **Station** = one activity type; the learning system chooses the content. Otherwise it's unclear whether stations are per letter, per activity or per difficulty.
- **Discoveries** are mentioned but undefined. Suggestion: hidden things in the world (a frog behind a stone) that the guide names when tapped: "En groda!". Exploration that is also vocabulary, and a reward source that doesn't depend on ability.

### 4.8 A parent area

Needed anyway for settings, reset, starting level and the "adult-facing summary" the PRD mentions.

- Behind a **parent gate**: a short *written* instruction with no audio (most of this age group can't read yet) combined with press-and-hold. Not a maths question, since maths is a planned expansion.
- Contents: audio and accessibility settings, starting level, a simple progress view (letters: new / practising / secure), **backup and restore of the save as a file**, reset.

---

## 5. Swedish literacy: rules the content system must enforce

These are *why* "reviewed content" matters, and they should become concrete validation rules.

1. **First sound ≠ first letter.** Store each word's initial sound as its own field; never derive it from spelling. Swedish examples that break the naive rule:
   - *sked* starts with the sj-sound, not /s/.
   - *kök* starts with the tj-sound, not /k/.
   - *get*, *hjärta*, *djur* and *ljus* all start with the same j-sound, spelled four different ways.

   Validation should flag every word where the first letter and the stored initial sound aren't the simple case, for human review; the easy levels use only simple-case words.
2. **Vowels are tricky.** O can sound like *u* (*ost*, *orm*) or like *å* (*olja*). Short E and short Ä sound the same in most of Sweden (*ett* / *ägg*), so "E or Ä?" by sound alone is unfair with short vowels. Prefer clear cases at easy levels.
3. **A/Å/Ä and O/Ö look alike.** That's a natural difficulty dial: at easy levels never use them as distractors for each other; at harder levels use them on purpose. The same goes for b/d/p and M/N/W. A small "confusability" table (visual and sound) should drive distractor choice and difficulty.
4. **Upper/lower case** isn't mentioned anywhere. Decide, ideally with a teacher: for example capitals first (many children meet capitals first, e.g. in their own name), lower case later as a difficulty step.
5. **Letter font.** Pixel fonts make letters ambiguous. Render learning letters in a clear literacy font. **Andika** is designed for beginning readers (single-storey a and g, distinct shapes), free under the SIL Open Font License, supports Å Ä Ö, and can be bundled locally. A pixel world and crisp letters mix fine.
6. **Picturable words only.** Picture activities must use things a 5-year-old recognises from a small picture. Å, Ä and Ö have good ones: *ål, åsna, älg, ägg, äpple, ö, öga, öra, örn*.
7. **Mastery as simple spaced repetition.** The PRD's "later review" can be a Leitner box system per content item: correct moves an item up a box, wrong moves it down, higher boxes come back less often. Rules-based, deterministic, testable, easy to explain to parents.
8. **Next activity types** (once the first four work): rhyme (*rim*) and syllable clapping (*stavelser*). Phonological awareness without letters often comes *before* letter-sound work for 5-year-olds, and needs only audio and pictures. Later: tracing letters with a finger.

If you know a förskoleklass or lågstadie teacher, one look at the first content list would be very valuable.

---

## 6. Technical recommendations

### Project hygiene

- `git init` before anything else. With me making every change, version history is your safety net and undo button.
- A root `CLAUDE.md` with the per-task rules (§3 #12).
- An ASCII package name (e.g. `kunskapslandet`). The `ä` in the folder path is fine for Node and Vite, but avoid native build tools that may trip on it.

### Architecture

- **Phaser for the world only. Activities, wardrobe, menus and parent area in React DOM.** The DOM is better for big touch buttons, keyboard focus, accessibility labels, responsive layout and the Andika font.
- **One character compositor**, independent of Phaser and React: it takes an appearance state and bakes one finished sprite sheet. Phaser loads it as a texture; React draws it on a `<canvas>`. That is how "the same renderer everywhere" is actually guaranteed, and it's faster: layers are combined once per outfit change, not every frame.
- **Tap-to-move** with simple A* pathfinding on the tile grid; tapping a station walks there and opens it; taps snap to the nearest walkable tile. Joystick optional and off by default (young children often find virtual joysticks hard).
- **Integer scaling** for pixel art, with a defined virtual resolution per device class, documented in the art direction doc.
- **Save layer from day one**: versioned schema and migration harness in the foundation; each task adds its own fields.

### iPad specifics (not in the docs, but they matter)

- **Saved progress can be deleted.** Safari deletes a website's script-writable storage, IndexedDB included, after 7 days of Safari use without visiting the site, unless the site was added to the Home Screen. A child losing all their unlocks is devastating. So:
  - Make the game a **PWA**: installable to the Home Screen, works offline, full screen without browser bars.
  - Request persistent storage where supported.
  - Offer **save export/import** in the parent area.
- **Silent mode can mute game audio.** Web Audio on iOS has historically followed the ringer/silent setting, and a muted iPad means a non-reader can't play. Test on a real device; newer Safari versions have an audio-session API that may help; show a picture-based "turn the sound on" hint if needed.
- **Disable browser gestures** inside the game: double-tap zoom, pinch zoom, text selection, long-press menus, pull-to-refresh.
- **Orientation** isn't specified. Recommend landscape-first, with a picture hint to rotate in portrait.
- Tip for parents: iPad **Guided Access** locks the device to the game.

### Testing

- Run Playwright tests in **WebKit** as well as Chromium; it's the closest automated stand-in for iPad Safari.
- I can check visuals myself in the browser pane (screenshots at desktop and iPad sizes). Real touch and real Safari need you and a real iPad.
- Make iPad testing effortless: serve the dev build on your local network, or deploy each reviewed build to free static hosting (e.g. Cloudflare Pages or GitHub Pages) so you just open a link.

---

## 7. Proposed revised task plan

Same values and acceptance-criteria style as the current plan, reordered so a child can play early, with the missing pieces added. Every task still ends with a stop for review.

| # | Task | Main content | Your part at review |
|---|---|---|---|
| 000 | **Setup & foundation** | git, `CLAUDE.md`, Vite + React + TS + Phaser, Vitest, Playwright (Chromium + WebKit), lint, PWA shell, versioned save layer + migration harness, deploy for iPad testing, clean task doc | Open the link on your iPad |
| 001 | **Art direction** | 16 vs 32 comparison, palette, style guide, contact-sheet tool, proof of mask-based clothing and anchors, guide character, `ART_DIRECTION.md` | Look at two comparison sheets, pick one |
| 002 | **Thin playable slice** | One-screen map, base character, tap-to-move, one station, letter recognition (about 6 letters incl. Å Ä Ö), placeholder voice (dev only), one hat granted once, mini wardrobe, save/reload | **First playtest with a child** |
| 003 | **Studio: content review + recording booth** | Content schema with initial-sound field, confusability table, approve/reject UI, recording booth with trim and loudness normalisation, audio manifest + validation | Review content, record batch 1 |
| 004 | **Character system** | Character creator (skin/hair/eyes), slots and layers, compositor, workshop, 15–20 items across rarities, the pet, mirrored directions | Look at outfit sheets |
| 005 | **World region** | Full region from text maps, autotiling, camera bounds, keyboard + joystick, stations, discoveries, locked regions | Walk around on the iPad |
| 006 | **Curriculum & activities** | All four activity engines, picture cards, seeded variation, validation, Leitner mastery, adaptation, hints and demonstrations | Approve words and pictures; picture test with a child |
| 007 | **Progression & parent area** | XP bar, levels, sticker album, rarity stars, reward ledger, parent gate, progress view, save export/import | Try to "break" the rewards |
| 008 | **Sound, accessibility & iPad polish** | Sound effects, music, reduced motion, iPad audio and gesture issues, performance | Device test, record remaining clips |
| 009 | **Release-readiness review** | As the current Task 010 | Playtest with a child again |

---

## 8. Questions for you

1. **Visual feedback.** When you say you can't do anything visual: can you look at a screenshot and say "that looks odd" (just not create art), or would you rather not judge visuals at all? This decides who gives visual sign-off.
2. **Voice.** Can you record the Swedish audio yourself, or ask someone? If not, is build-time TTS acceptable for instructions, knowing phonics still needs a human voice?
3. **Content review.** Are you comfortable approving Swedish word lists and letter sounds? Do you know a förskoleklass or lågstadie teacher who could look once?
4. **Playtesting.** Do you have access to a child aged 5–7 who could try it?
5. **Device.** Do you have an iPad to test on? Which model, roughly?
6. **Name.** Lärrutan or Kunskapslandet?
7. **Environment art.** Is falling back to a free CC0 pack for the environment acceptable if mine isn't good enough?

---

## 9. What I'd change in the docs once you say go

**PRD.md**

- Fix the age range and the name.
- New section: **Roles and responsibilities** (§2).
- Audio: the production pipeline (recording booth, dev-only placeholder rule, loudness normalisation).
- Character: free base identity, fewer MVP slots, guide character.
- Rewards: the three resolutions in §4.2 and the presentation rules in §4.3.
- Curriculum: the rules in §5.
- New: parent area and parent gate.
- Platform: PWA, storage eviction and save export, iOS audio, orientation, gestures.
- Asset inventory: picture cards, sound effects, music, font, guide.
- Development sequence: the vertical-slice order.

**CLAUDE_TASKS.md**

- Fix the broken formatting.
- Move the general rules into `CLAUDE.md`.
- Replace the task list with the revised plan, keeping each task's Goal / Work / Constraints / Acceptance criteria / Stop condition structure and adding a "What the user checks" line.
