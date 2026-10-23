import { firstLetterOf, type Letter } from './letters'
import type { Word } from './words'

/**
 * Content rules from PRD §5, as checks. Each returns problems in plain words;
 * an empty list means the content is fine. Tests run these over all content.
 */

export function findWordProblems(word: Word, from: readonly Letter[]): string[] {
  const problems: string[] = []
  const label = `"${word.base}" (${word.id})`

  if (!/^[a-z][a-z-]*$/.test(word.id)) problems.push(`${label}: id must be lower-case ASCII`)
  for (const [field, value] of Object.entries({
    base: word.base,
    indefinite: word.indefinite,
    definite: word.definite,
  })) {
    if (value.trim() === '') problems.push(`${label}: ${field} is empty`)
    if (value !== value.normalize('NFC')) problems.push(`${label}: ${field} is not NFC-normalised`)
  }

  const letter = from.find((l) => l.id === word.firstLetter)
  if (!letter) {
    problems.push(`${label}: unknown first letter "${word.firstLetter}"`)
    return problems
  }
  if (firstLetterOf(word.base, from) !== letter.id) {
    problems.push(`${label}: is spelled with a different first letter than ${letter.display}`)
  }
  if (word.firstSound !== letter.sound) {
    problems.push(
      `${label}: starts with the sound "${word.firstSound}", not the plain ${letter.display}-sound, so it can't be used at early levels`,
    )
  }
  if (word.alsoCalled.includes(word.base)) problems.push(`${label}: alsoCalled repeats the word itself`)
  return problems
}

export function findWordListProblems(list: readonly Word[], from: readonly Letter[]): string[] {
  const problems = list.flatMap((word) => findWordProblems(word, from))
  for (const field of ['id', 'base'] as const) {
    const seen = new Set<string>()
    for (const word of list) {
      if (seen.has(word[field])) problems.push(`duplicate ${field} "${word[field]}"`)
      seen.add(word[field])
    }
  }
  return problems
}

/** Letters a child could pick for this picture by using one of its other names. */
export function alsoCalledLetters(word: Word, from: readonly Letter[]): Set<string> {
  const ids = word.alsoCalled.map((name) => firstLetterOf(name, from))
  return new Set(ids.filter((id): id is string => id !== undefined && id !== word.firstLetter))
}
