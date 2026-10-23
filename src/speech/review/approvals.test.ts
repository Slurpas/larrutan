import { describe, expect, it } from 'vitest'
import { applyReview, countReviews, noApprovals, pruneApprovals } from './approvals'

const clips = new Map([
  ['oga-11111111.mp3', 'Öga.'],
  ['var-ar-a-22222222.mp3', 'Var är A?'],
])
const now = new Date('2026-10-23T03:00:00Z')

describe('clip approvals', () => {
  it('records an approval and a rejection with its note', () => {
    const approved = applyReview(noApprovals, { file: 'var-ar-a-22222222.mp3', status: 'approved' }, clips, now)
    const both = applyReview(approved, { file: 'oga-11111111.mp3', status: 'rejected', note: '  säger öka ' }, clips, now)
    expect(both.clips).toEqual({
      'oga-11111111.mp3': { text: 'Öga.', status: 'rejected', note: 'säger öka', reviewedAt: '2026-10-23T03:00:00.000Z' },
      'var-ar-a-22222222.mp3': { text: 'Var är A?', status: 'approved', reviewedAt: '2026-10-23T03:00:00.000Z' },
    })
    expect(countReviews([...clips.keys()], both)).toEqual({ approved: 1, rejected: 1, unreviewed: 0 })
  })

  it('can take a decision back', () => {
    const approved = applyReview(noApprovals, { file: 'oga-11111111.mp3', status: 'approved' }, clips, now)
    expect(applyReview(approved, { file: 'oga-11111111.mp3', status: 'unreviewed' }, clips, now).clips).toEqual({})
  })

  it('refuses unknown clips, statuses and oversized notes', () => {
    const bad = [
      null,
      'approve',
      { file: '../../package.json', status: 'approved' },
      { file: 'oga-11111111.mp3', status: 'maybe' },
      { file: 'oga-11111111.mp3', status: 'rejected', note: 'x'.repeat(301) },
      { file: 'oga-11111111.mp3', status: 'rejected', note: 42 },
    ]
    for (const request of bad) expect(() => applyReview(noApprovals, request, clips, now)).toThrow()
  })

  it('forgets decisions about clips that were regenerated or removed', () => {
    const approved = applyReview(noApprovals, { file: 'oga-11111111.mp3', status: 'approved' }, clips, now)
    expect(pruneApprovals(approved, new Set(['oga-99999999.mp3'])).clips).toEqual({})
    expect(countReviews(['oga-99999999.mp3'], approved)).toEqual({ approved: 0, rejected: 0, unreviewed: 1 })
  })
})
