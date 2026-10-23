import { useSyncExternalStore } from 'react'
import { loadSavedProgress, saveProgress } from '../persistence/saveGame'
import { completeRound, initialProgress, wear, type Progress, type RoundCompletion, type RoundOutcome } from './progress'

/** The child's progress. It is loaded from the device at startup and saved after every change. */
let progress: Progress = initialProgress
const listeners = new Set<() => void>()

/** Off until the save has been read: a save that is slow to load or can't be read is never overwritten. */
let saving = false
let loading: Promise<void> | null = null

function update(next: Progress) {
  if (next === progress) return
  progress = next
  listeners.forEach((listener) => listener())
  if (saving) void saveProgress(next)
}

/** Reads the saved game once. Resolves even when there is no save or it can't be read. */
export function loadProgress(): Promise<void> {
  loading ??= loadSavedProgress().then((result) => {
    if (result.kind === 'loaded' || result.kind === 'newer') update(result.progress)
    saving = result.kind === 'loaded' || result.kind === 'empty'
  })
  return loading
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
