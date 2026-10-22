import { useSyncExternalStore } from 'react'
import { completeRound, initialProgress, wear, type Progress, type RoundCompletion, type RoundOutcome } from './progress'

/**
 * The child's progress for this play session. Phase 1 keeps it in memory only,
 * so it resets when the page reloads; saving comes with Task 7.
 */
let progress: Progress = initialProgress
const listeners = new Set<() => void>()

function update(next: Progress) {
  if (next === progress) return
  progress = next
  listeners.forEach((listener) => listener())
}

export function getProgress(): Progress {
  return progress
}

export function subscribeProgress(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Rewards a finished round. Calling it again with the same round id changes nothing and returns the same outcome. */
export function recordRound(completion: RoundCompletion): RoundOutcome {
  const result = completeRound(progress, completion)
  update(result.progress)
  return result.outcome
}

export function wearItem(itemId: string | null): void {
  update(wear(progress, itemId))
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribeProgress, getProgress)
}
