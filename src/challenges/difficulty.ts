import type { ChallengeId } from './challengeIds'

/** How hard a round is. The hard level mixes in look-alike letters on purpose (PRD §5). */
export type Difficulty = 'easy' | 'hard'

/** The difficulties each challenge offers, easiest first. */
export const challengeDifficulties: Record<ChallengeId, readonly Difficulty[]> = {
  findLetter: ['easy', 'hard'],
  firstLetter: ['easy', 'hard'],
  wordPicture: ['easy'],
}

/** Identifies one challenge level, e.g. "findLetter:hard". */
export function levelKey(challenge: ChallengeId, difficulty: Difficulty): string {
  return `${challenge}:${difficulty}`
}

/** The first level the child hasn't completed yet; once all are done, the hardest. */
export function nextDifficulty(challenge: ChallengeId, completedLevels: readonly string[]): Difficulty {
  const difficulties = challengeDifficulties[challenge]
  const open = difficulties.find((d) => !completedLevels.includes(levelKey(challenge, d)))
  return open ?? difficulties[difficulties.length - 1] ?? 'easy'
}
