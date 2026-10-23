/**
 * Approval of generated clips (PRD §7). Decisions live in `src/speech/audio/sv/approvals.json`,
 * keyed by clip file name. A file name changes whenever the audio changes (`clipName.ts`),
 * so a regenerated clip is automatically unreviewed again.
 */
export type ReviewStatus = 'approved' | 'rejected'

export interface Review {
  /** The sentence, so the file is readable on its own. */
  text: string
  status: ReviewStatus
  /** What's wrong, for a rejected clip: "säger öka". */
  note?: string
  reviewedAt: string
}

export interface Approvals {
  clips: Record<string, Review>
}

/** One decision from the review page; `unreviewed` takes a decision back. */
export interface ReviewRequest {
  file: string
  status: ReviewStatus | 'unreviewed'
  note?: string
}

export const noApprovals: Approvals = { clips: {} }

/** Where the review page (?review=voices) reads and saves decisions; served by the dev server only. */
export const voiceReviewEndpoint = '/__voice-review'
const maxNoteLength = 300

/**
 * Records a decision for a clip that exists (`clipTexts`: file name → sentence).
 * Anything else is refused, because the request comes over the network from the review page.
 */
export function applyReview(approvals: Approvals, request: unknown, clipTexts: ReadonlyMap<string, string>, now: Date): Approvals {
  if (typeof request !== 'object' || request === null) throw new Error('Expected a review')
  const { file, status, note } = request as Record<string, unknown>
  if (typeof file !== 'string' || !clipTexts.has(file)) throw new Error(`Unknown clip: ${String(file)}`)
  if (status !== 'approved' && status !== 'rejected' && status !== 'unreviewed') throw new Error(`Unknown status: ${String(status)}`)
  if (note !== undefined && (typeof note !== 'string' || note.length > maxNoteLength)) throw new Error('Bad note')

  const clips = { ...approvals.clips }
  if (status === 'unreviewed') {
    delete clips[file]
  } else {
    const trimmed = note?.trim()
    clips[file] = {
      text: clipTexts.get(file) ?? '',
      status,
      ...(trimmed ? { note: trimmed } : {}),
      reviewedAt: now.toISOString(),
    }
  }
  return { clips: sortedByFile(clips) }
}

/** Drops decisions about clips that no longer exist (their sentence or audio changed). */
export function pruneApprovals(approvals: Approvals, existingFiles: ReadonlySet<string>): Approvals {
  return { clips: sortedByFile(Object.fromEntries(Object.entries(approvals.clips).filter(([file]) => existingFiles.has(file)))) }
}

export function countReviews(files: readonly string[], approvals: Approvals) {
  const counts = { approved: 0, rejected: 0, unreviewed: 0 }
  for (const file of files) counts[approvals.clips[file]?.status ?? 'unreviewed']++
  return counts
}

/** Stable order, so the JSON file diffs cleanly in git. */
function sortedByFile(clips: Record<string, Review>): Record<string, Review> {
  return Object.fromEntries(Object.entries(clips).sort(([a], [b]) => a.localeCompare(b)))
}
