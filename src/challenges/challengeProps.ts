import type { RoundOutcome } from '../rewards/progress'
import type { RoundResult } from './useChoiceRound'
import type { Level } from './levels'

/** What the app gives every challenge screen. */
export interface ChallengeScreenProps {
  seed: number
  /** The station's level (src/challenges/levels.ts). */
  level: Level
  /** The station has just gone up to this level: say what is harder, once. */
  announceLevel: boolean
  /** The child has finished this challenge before, so questions can start in their short form. */
  knowsChallenge: boolean
  /** Mastery box of a letter or word in this challenge, so a round can favour what is still being learned. */
  practiceBox: (item: string) => number
  /** Records the finished round and returns what it earned. */
  onRoundComplete: (result: RoundResult) => RoundOutcome
  onExit: () => void
  onPlayAgain: () => void
}
