/**
 * Sentences recorded again because one take sounded off: the voice says the same
 * text a little differently every time, so a fresh take often fixes a slip that no
 * pronunciation fix would. The take number is part of the clip's file name
 * (`clipName.ts`), so `npm run speech` makes the new take, the old one and its
 * review are dropped, and no browser can play the old take from its cache.
 *
 * Use this when the words are right but one recording isn't; fix a word that is
 * always wrong in `src/content/pronunciation.ts` instead.
 */
export const retakes: Readonly<Record<string, number>> = {
  // "Dou fick …" (review 2026-10-23); "Du fick en ballong!" was fine.
  'Du fick en rosett!': 2,
  'Du fick gröna byxor!': 2,
}
