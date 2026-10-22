import type { RoundOutcome } from '../rewards/progress'
import type { Difficulty } from './difficulty'

/** What the app gives every challenge screen. */
export interface ChallengeScreenProps {
  seed: number
  difficulty: Difficulty
  /** Records the finished round and returns what it earned. */
  onRoundComplete: (wrongTaps: number) => RoundOutcome
  onExit: () => void
  onPlayAgain: () => void
}
