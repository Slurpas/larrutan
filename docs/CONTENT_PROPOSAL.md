# Content proposal: next letters and words (Task 11)

**Status: draft for the user's approval (2026-10-23).** Nothing here is in the game yet. PRD §5: the user approves letter and word lists before they are used.

## Letters

Today: A I L M O S Å Ä Ö (9). Proposed next: **R, N, T, F** (13 in total).

| Letter | Why now | Look-alike rule to add |
|---|---|---|
| R | Common, a long clear sound, many picturable words | None |
| N | Common, clear sound | **M/N look alike**: never together at the easy level; the hard level offers one on purpose |
| T | Common, many picturable words | None |
| F | Clear sound; good picturable words | None (E isn't in the set yet) |

**Proposed to wait:**
- **E** waits because a short E sounds like Ä (*elefant*, *äpple*), and the PRD forbids asking children to tell those apart by sound. Only *ekorre* has a clear long E.
- **U** waits because O often sounds like U (*ost*, *sol*). Only *uggla* is a strong picture word.
- Both need a new kind of rule first: letters that may never appear together in Första bokstaven, at any level. That's a small change, but worth doing on its own when we get there.

## Words (15 new and a spare; 43 in total)

Every word starts with the plain sound of its letter (PRD §5 rule 1). None start with sj-, tj- or j-sounds.
- **Pictures:** emoji placeholders from Unicode 13 or older, so they work on older iPads.
- **"Also called":** other names a child might use. They keep misleading choices out of a question. For example, *tåg* is also *lok*, so L is never a wrong choice for *tåg*.

| Word | Picture | Letter | Also called | Notes |
|---|---|---|---|---|
| robot | 🤖 | R | | Stress on the second syllable; check the voice |
| räv | 🦊 | R | | |
| raket | 🚀 | R | rymdskepp | Stress on the second syllable |
| ros | 🌹 | R | blomma | |
| näsa | 👃 | N | | |
| nyckel | 🔑 | N | | |
| nalle | 🧸 | N | björn, gosedjur | |
| tåg | 🚂 | T | lok | L never a wrong choice |
| tand | 🦷 | T | | |
| tomat | 🍅 | T | | Stress on the second syllable |
| tiger | 🐯 | T | lejon | Some children say *lejon*: L is never a wrong choice, and tiger and lion never appear together in Ord och bild |
| fisk | 🐟 | F | | |
| fjäril | 🦋 | F | | *fj* starts with a plain F sound |
| fot | 🦶 | F | | |
| får | 🐑 | F | lamm | L is never a wrong choice |
| tält | ⛺ | T | | Spare, if a T word is rejected |

N has three words (a needle is too hard to recognise as a small picture). *Tält* is a spare.

## What happens on approval

1. **Data:** I add the approved letters and words to `src/content`. The content tests check every rule above automatically.
2. **Voice:** I generate their speech (about 100 new clips) and fix any words the voice says wrong.
3. **Your review:** you listen on `?review=voices`, where only the new clips show up as "to review".
4. **Your child:** a short playtest with the new pictures.

**What I need from you:**
- Approve, remove or replace words, especially any picture your child would call something else.
- Agree that E and U wait.
