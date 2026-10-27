/**
 * The numbers the maths games count with, 1 to 10: the value (shown as a digit, in Andika)
 * and the word that is said ("Sju."). Counting uses "ett", not "en".
 */
export interface NumberWord {
  value: number
  word: string
}

export const numberWords: readonly NumberWord[] = [
  { value: 1, word: 'ett' },
  { value: 2, word: 'två' },
  { value: 3, word: 'tre' },
  { value: 4, word: 'fyra' },
  { value: 5, word: 'fem' },
  { value: 6, word: 'sex' },
  { value: 7, word: 'sju' },
  { value: 8, word: 'åtta' },
  { value: 9, word: 'nio' },
  { value: 10, word: 'tio' },
]

export function numberWord(value: number): string {
  const number = numberWords.find((n) => n.value === value)
  if (!number) throw new Error(`No word for the number ${value}`)
  return number.word
}
