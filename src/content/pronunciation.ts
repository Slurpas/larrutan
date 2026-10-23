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
  byxorna: 'bˈʏksʊɳa',
  regnbågsbyxor: 'rˈɛŋnboːɡsbˌʏksʊr',
  regnbågsbyxorna: 'rˈɛŋnboːɡsbˌʏksʊɳa',
  // Short y and a clear ä.
  ryggsäck: 'rˈʏɡsˌɛk',
  ryggsäcken: 'rˈʏɡsˌɛkən',
  // Long a in "stav".
  trollstav: 'trˈɔlstˌɑːv',
  trollstaven: 'trˈɔlstˌɑːvən',
  // "ord" has an o that sounds like u.
  orden: 'ˈuːɖən',
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
 * Piper itself makes no real pause inside a sentence, whatever the punctuation.
 */
export function withPauses(text: string): string {
  return text.replace(/^(Var är) (.+\?)$/u, `$1, ${pauseMark} $2`)
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
