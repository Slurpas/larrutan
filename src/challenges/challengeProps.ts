import type { RoundOutcome } from '../rewards/progress'
import type { RoundResult } from './useChoiceRound'
import type { Difficulty } from './difficulty'

/** What the app gives every challenge screen. */
export interface ChallengeScreenProps {
  seed: number
  difficulty: Difficulty
  /** The child has finished this challenge before, so questions can start in their short form. */
  knowsChallenge: boolean
  /** Mastery box of a letter or word in this challenge, so a round can favour what is still being learned. */
  practiceBox: (item: string) => number
  /** Records the finished round and returns what it earned. */
  onRoundComplete: (result: RoundResult) => RoundOutcome
  onExit: () => void
  onPlayAgain: () => void
}
