/**
 * Sentences recorded again because one take sounded off: the voice says the same
 * text a little differently every time, so a fresh take often fixes a slip that no
 * pronunciation fix would. With ElevenLabs a new take asks for a new recording (a new
 * seed), so it costs credits. The take number is part of the clip's file name
 * (`clipName.ts`), so `npm run speech` makes the new take, the old one and its
 * review are dropped, and no browser can play the old take from its cache.
 *
 * Use this when the words are right but one recording isn't; fix a word that is
 * always wrong in `src/content/pronunciation.ts` instead.
 */
export const retakes: Readonly<Record<string, number>> = {
  // Alma's retakes ("Dou fick …", 2026-10-23) were dropped when the voice changed on 2026-10-25.
  // The first take left out the letter: "Draken vill ha ett …" and nothing (the user, 2026-10-25).
  'Draken vill ha ett Ä!': 2,
}
