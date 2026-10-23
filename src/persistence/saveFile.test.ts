import { describe, expect, it } from 'vitest'
import { completeRound, initialProgress, wear, type Progress } from '../rewards/progress'
import { readSave, saveVersion, toSaveFile } from './saveFile'

const now = new Date('2026-10-23T12:00:00Z')

/** Some real progress: two rounds played (level 2), the cap and bow unlocked, the cap worn. */
function playedProgress(): Progress {
  const first = completeRound(initialProgress, { roundId: 'r1', challenge: 'findLetter', difficulty: 'easy', wrongTaps: 0 })
  const second = completeRound(first.progress, { roundId: 'r2', challenge: 'firstLetter', difficulty: 'easy', wrongTaps: 3 })
  return wear(second.progress, 'cap')
}

/** What actually comes back from IndexedDB: a structured clone, so a JSON round trip is close enough. */
function stored(progress: Progress) {
  return JSON.parse(JSON.stringify(toSaveFile(progress, now))) as unknown
}

describe('saving and loading', () => {
  it('gives back the same progress, without the round ledger', () => {
    const progress = playedProgress()
    expect(readSave(stored(progress))).toEqual({
      kind: 'loaded',
      progress: { ...progress, rounds: {} },
      repaired: false,
    })
  })

  it('stores a version and the time it was saved', () => {
    const file = toSaveFile(playedProgress(), now)
    expect(file.version).toBe(saveVersion)
    expect(file.savedAt).toBe('2026-10-23T12:00:00.000Z')
    expect(file.progress).not.toHaveProperty('rounds')
  })

  it('reports an empty save when nothing is stored yet', () => {
    expect(readSave(undefined)).toEqual({ kind: 'empty' })
    expect(readSave(null)).toEqual({ kind: 'empty' })
  })

  it('still rewards the first round after loading, because round ids are not saved', () => {
    const loaded = readSave(stored(playedProgress()))
    if (loaded.kind !== 'loaded') throw new Error(loaded.kind)
    const again = completeRound(loaded.progress, { roundId: 'r1', challenge: 'wordPicture', difficulty: 'easy', wrongTaps: 0 })
    expect(again.outcome.xpGained).toBeGreaterThan(0)
  })
})

describe('recovering from broken saves', () => {
  it('starts fresh, and says so, when the save is unreadable', () => {
    for (const junk of ['oops', 42, [], {}, { version: 'one' }, { version: 0 }, { version: -1, progress: {} }]) {
      expect(readSave(junk)).toEqual({ kind: 'loaded', progress: initialProgress, repaired: true })
    }
  })

  it('keeps the good parts when one field is broken', () => {
    const file = stored(playedProgress()) as { progress: Record<string, unknown> }
    file.progress.xp = 'lots'
    const result = readSave(file)
    expect(result).toMatchObject({ kind: 'loaded', repaired: true })
    if (result.kind !== 'loaded') return
    expect(result.progress.xp).toBe(0)
    expect(result.progress.unlockedItems).toEqual(['cap', 'bow'])
    expect(result.progress.wornItem).toBe('cap')
    expect(result.progress.completedLevels).toEqual(['findLetter:easy', 'firstLetter:easy'])
  })

  it('never accepts negative, fractional or huge numbers', () => {
    for (const xp of [-5, 2.5, Number.NaN, Infinity, 2 ** 60]) {
      const file = stored(playedProgress()) as { progress: Record<string, unknown> }
      file.progress.xp = xp
      expect(readSave(file)).toMatchObject({ kind: 'loaded', repaired: true, progress: { xp: 0 } })
    }
  })

  it('drops unknown items and levels, and duplicates', () => {
    const file = stored(playedProgress()) as { progress: Record<string, unknown> }
    file.progress.unlockedItems = ['cap', 'dragon', 'bow', 'cap', 7]
    file.progress.completedLevels = ['findLetter:easy', 'findLetter:impossible']
    const result = readSave(file)
    expect(result).toMatchObject({
      kind: 'loaded',
      repaired: true,
      progress: { unlockedItems: ['cap', 'bow'], completedLevels: ['findLetter:easy'] },
    })
  })

  it('takes off a worn item that is not unlocked', () => {
    const file = stored(playedProgress()) as { progress: Record<string, unknown> }
    file.progress.wornItem = 'crown'
    expect(readSave(file)).toMatchObject({ kind: 'loaded', repaired: true, progress: { wornItem: null } })
  })

  it('plays a save from a newer version of the game but marks it, so it is never overwritten', () => {
    const file = stored(playedProgress()) as { version: number; progress: Record<string, unknown> }
    file.version = saveVersion + 1
    file.progress.pets = ['dragon']
    const result = readSave(file)
    expect(result.kind).toBe('newer')
    expect(result).toMatchObject({ progress: { unlockedItems: ['cap', 'bow'], wornItem: 'cap' } })
  })
})
