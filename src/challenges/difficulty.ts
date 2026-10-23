import type { ChallengeId } from './challengeIds'

/**
 * How hard a round is (PRD §5, §6). The hard level is clearly harder: four choices
 * instead of three, with the letters that look alike (A, Å, Ä; O, Ö) among them.
 */
export type Difficulty = 'easy' | 'hard'

/** The difficulties each challenge offers, easiest first. */
export const challengeDifficulties: Record<ChallengeId, readonly Difficulty[]> = {
  findLetter: ['easy', 'hard'],
  firstLetter: ['easy', 'hard'],
  wordPicture: ['easy'],
}

/** How many choices a question offers at each level. */
export const choiceCounts: Record<Difficulty, number> = { easy: 3, hard: 4 }

/**
 * When a station changes level (a gentle, reversible rule, PRD §6; user feedback
 * 2026-10-24): an easy round with at most `upAtMostWrong` wrong taps makes the next
 * round at that station hard; a hard round with at least `downAtLeastWrong` makes it
 * easy again. Otherwise it stays. Rewards never depend on this.
 */
export const levelRules = { upAtMostWrong: 1, downAtLeastWrong: 4 } as const

/** Identifies one challenge level, e.g. "findLetter:hard". */
export function levelKey(challenge: ChallengeId, difficulty: Difficulty): string {
  return `${challenge}:${difficulty}`
}

/** The level each station opens at; a station never played opens easy. */
export type StationLevels = Readonly<Partial<Record<ChallengeId, Difficulty>>>

export function nextDifficulty(challenge: ChallengeId, levels: StationLevels): Difficulty {
  const level = levels[challenge] ?? 'easy'
  return challengeDifficulties[challenge].includes(level) ? level : 'easy'
}

/** The level a station opens at next time, after a round played at `difficulty` with `wrongTaps` slips. */
export function levelAfterRound(challenge: ChallengeId, difficulty: Difficulty, wrongTaps: number): Difficulty {
  if (!challengeDifficulties[challenge].includes('hard')) return 'easy'
  if (difficulty === 'easy') return wrongTaps <= levelRules.upAtMostWrong ? 'hard' : 'easy'
  return wrongTaps >= levelRules.downAtLeastWrong ? 'easy' : 'hard'
}
