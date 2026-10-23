/**
 * Words the speech engine (Piper, which guesses pronunciation from spelling
 * with espeak-ng) gets wrong, written in IPA as they should sound. Only used
 * when generating audio (`npm run speech`); the game never sees this.
 *
 * Use the same symbols espeak-ng produces (e.g. "ɡ", not "g"); the generator
 * checks every symbol against the voice. Stress mark ˈ goes before the
 * stressed syllable, ː marks a long sound.
 */
export const pronunciations: Record<string, string> = {
  // k before e is usually soft (tj-sound), but not in "keps".
  keps: 'kˈɛps',
  kepsen: 'kˈɛpsən',
  // Short a and stress on the first syllable, not "aa-na-nas".
  ananas: 'ˈananas',
  ananasen: 'ˈananasən',
  // Stress on the second syllable.
  rosett: 'rʊsˈɛt',
  rosetten: 'rʊsˈɛtən',
  studentmössa: 'stʉdˈɛntmˌœsa',
  studentmössan: 'stʉdˈɛntmˌœsan',
  nivån: 'nɪvˈoːn',
  // Hard g, not "ijelkott" / "snijeln".
  igelkott: 'ˈiːɡəlkˌɔt',
  igelkotten: 'ˈiːɡəlkˌɔtən',
  snigeln: 'snˈiːɡəln',
  // Short vowels.
  orm: 'ˈʊrm',
  ormen: 'ˈʊrmən',
  osten: 'ˈʊstən',
  lejon: 'lˈɛjɔn',
  lejonet: 'lˈɛjɔnət',
  åska: 'ˈɔska',
  åskan: 'ˈɔskan',
  örat: 'ˈøːrat',
  // Long i in "is".
  isbit: 'ˈiːsbiːt',
  isbiten: 'ˈiːsbiːtən',
  // Wardrobe items (Task 10).
  // Stress on the second syllable, not "BAL-long".
  ballong: 'balˈɔŋ',
  ballongen: 'balˈɔŋən',
  // Short y and short o, not "byy-xoor".
  byxor: 'bˈʏksʊr',
  // An explicit r before n: with the retroflex ɳ it came out as "byxåa" (review 2026-10-23).
  byxorna: 'bˈʏksʊrna',
  regnbågsbyxor: 'rˈɛŋnboːɡsbˌʏksʊr',
  regnbågsbyxorna: 'rˈɛŋnboːɡsbˌʏksʊrna',
  // Short y and a clear ä.
  ryggsäck: 'rˈʏɡsˌɛk',
  ryggsäcken: 'rˈʏɡsˌɛkən',
  // Long a in "stav".
  trollstav: 'trˈɔlstˌɑːv',
  trollstaven: 'trˈɔlstˌɑːvən',
  // "ord" has an o that sounds like u. The retroflex d got lost ("or och bild", "oen"),
  // a plain d is heard (reviews 2026-10-23).
  ord: 'ˈuːd',
  orden: 'ˈuːdən',
  // The voice drops the sj-sound (ɧ) entirely: "sju" came out as "lu", "skylt" as "vilt",
  // "stjärntröja" as "ä-tröja" (review 2026-10-23; no hiss at all in any take). The
  // sh-like ʂ (as in "första") is clearly heard, and many Swedes say sj that way.
  sju: 'ʂˈʉː',
  skylt: 'ʂˈʏlt',
  // With the retroflex ɳ "stjärn" came out as "sjö"; an explicit r and n, as in "byxorna".
  stjärntröja: 'ʂˈɛːrntrˌøːja',
  stjärntröjan: 'ʂˈɛːrntrˌøːjan',
  // The letter M, said "emm": with a short m it was heard as N (review 2026-10-23).
  m: 'ˈɛmː',
  // No j-glide between i and o: "tio" sounded like "tiko" (review 2026-10-23).
  tio: 'tˈiːʊ',
  nio: 'nˈiːʊ',
  trettiofem: 'trˈɛtːɪʊfˌɛm',
  // The bigger wardrobe (Task 14), fixed the same ways as above.
  fyrtiofem: 'fˈœʈɪʊfˌɛm',
  sextiofem: 'sˈɛkstɪʊfˌɛm',
  hundrafemtio: 'hˈɵndrafˌɛmtɪ',
  stjärnbyxor: 'ʂˈɛːrnbˌʏksʊr',
  stjärnbyxorna: 'ʂˈɛːrnbˌʏksʊrna',
  fjärilsvingarna: 'fjˈɛːrɪlsvˌɪŋarna',
  guldvingarna: 'ɡˈɵldvˌɪŋarna',
  // "party" as Swedes say it, not with a y.
  partyhatt: 'pˈɑːʈɪhˌat',
  partyhatten: 'pˈɑːʈɪhˌatːən',
  // "sol" in solros is long (suːl), not "soll".
  solros: 'sˈuːlrˌuːs',
  solrosen: 'sˈuːlrˌuːsən',
  // Stress on the first part of the compound.
  kockmössa: 'kˈɔkmˌœsa',
  kockmössan: 'kˈɔkmˌœsan',
  regnbågsmantel: 'rˈɛŋnboːɡsmˌantəl',
  regnbågsmanteln: 'rˈɛŋnboːɡsmˌantəln',
  // "hjälm" with a clear ä.
  vikingahjälm: 'vˈiːkɪŋaˌjɛlm',
  vikingahjälmen: 'vˈiːkɪŋaˌjɛlmən',
  // A long Swedish u, not "göl".
  gul: 'ɡˈʉːl',
}

/**
 * Replaces words that have a fixed pronunciation with Piper's raw-phoneme
 * syntax: "keps!" → "[[ kˈɛps! ]]". Punctuation right after the word goes
 * inside the block, or Piper drops it and loses the question/exclamation tone.
 */
/** Where the speech generator puts a short silence: it says each part on its own and joins them. */
export const pauseMark = '|'

/**
 * "Var är Å?" → "Var är, | Å?": a short pause before what the child must find, so it
 * stands out (user feedback 2026-10-23). The comma keeps the question going in the voice.
 * The same for "Draken vill ha ett, | Å!". Piper itself makes no real pause inside a
 * sentence, whatever the punctuation.
 */
export function withPauses(text: string): string {
  return text.replace(/^(Var är) (.+\?)$/u, `$1, ${pauseMark} $2`).replace(/^(Draken vill ha ett) (.+!)$/u, `$1, ${pauseMark} $2`)
}

/** What the speech engine is given for a sentence: pauses, then fixed pronunciations. */
export function speechInput(text: string): string {
  return withPronunciations(withPauses(text))
}

export function withPronunciations(text: string): string {
  return text.replace(/(\p{L}+)([!?.,]?)/gu, (match, word: string, punctuation: string) => {
    const ipa = pronunciations[word.toLocaleLowerCase('sv')]
    return ipa ? `[[ ${ipa}${punctuation} ]]` : match
  })
}
