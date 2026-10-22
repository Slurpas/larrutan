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
}

/**
 * Replaces words that have a fixed pronunciation with Piper's raw-phoneme
 * syntax: "keps!" → "[[ kˈɛps! ]]". Punctuation right after the word goes
 * inside the block, or Piper drops it and loses the question/exclamation tone.
 */
export function withPronunciations(text: string): string {
  return text.replace(/(\p{L}+)([!?.,]?)/gu, (match, word: string, punctuation: string) => {
    const ipa = pronunciations[word.toLocaleLowerCase('sv')]
    return ipa ? `[[ ${ipa}${punctuation} ]]` : match
  })
}
