import { describe, expect, it } from 'vitest'
import { completeRound, initialProgress, wear, type Progress } from '../rewards/progress'
import { readSave, saveVersion, toSaveFile } from './saveFile'

const now = new Date('2026-10-23T12:00:00Z')

/** Some real progress: two rounds played (level 2), four items unlocked, the cap worn. */
function playedProgress(): Progress {
  const first = completeRound(initialProgress, {
    roundId: 'r1',
    challenge: 'findLetter',
    difficulty: 'easy',
    wrongTaps: 0,
    practiced: [{ item: 'a', firstTry: true }],
  })
  const second = completeRound(first.progress, {
    roundId: 'r2',
    challenge: 'firstLetter',
    difficulty: 'easy',
    wrongTaps: 3,
    practiced: [{ item: 'sun', firstTry: false }],
  })
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
    const again = completeRound(loaded.progress, {
      roundId: 'r1',
      challenge: 'wordPicture',
      difficulty: 'easy',
      wrongTaps: 0,
      practiced: [],
    })
    expect(again.outcome.xpGained).toBeGreaterThan(0)
  })
})

describe('upgrading old saves', () => {
  it('upgrades a version 1 save (Task 7) without losing anything, starting mastery empty', () => {
    const progress = { xp: 40, roundsCompleted: 2, completedLevels: ['findLetter:easy', 'firstLetter:easy'], unlockedItems: ['cap', 'bow'] }
    const version1 = { version: 1, savedAt: '2026-10-23T02:00:00.000Z', progress: { ...progress, wornItem: 'cap' } }
    expect(readSave(version1)).toEqual({
      kind: 'loaded',
      repaired: false,
      // Easy done at both stations: they opened hard, and still do.
      progress: { ...progress, worn: { head: 'cap' }, mastery: {}, levels: { findLetter: 'hard', firstLetter: 'hard' }, itemsSeen: 0, rounds: {} },
    })
  })

  it('upgrades a version 2 save (Task 11): the one worn hat moves into the head slot', () => {
    const progress = { xp: 90, roundsCompleted: 4, completedLevels: ['findLetter:hard'], unlockedItems: ['cap', 'top-hat'], mastery: { 'findLetter:a': 3 } }
    for (const [wornItem, worn] of [['top-hat', { head: 'top-hat' }], [null, {}]] as const) {
      const version2 = { version: 2, savedAt: '2026-10-23T09:00:00.000Z', progress: { ...progress, wornItem } }
      expect(readSave(version2)).toEqual({ kind: 'loaded', repaired: false, progress: { ...progress, worn, levels: {}, itemsSeen: 0, rounds: {} } })
    }
  })

  it('upgrades a version 3 save (Task 10): stations whose easy level is done open hard, as before', () => {
    const progress = {
      xp: 120,
      roundsCompleted: 6,
      completedLevels: ['findLetter:easy', 'findLetter:hard', 'firstLetter:hard', 'wordPicture:easy'],
      unlockedItems: ['cap'],
      worn: { head: 'cap' },
      mastery: {},
    }
    const version3 = { version: 3, savedAt: '2026-10-24T09:00:00.000Z', progress }
    expect(readSave(version3)).toEqual({
      kind: 'loaded',
      repaired: false,
      progress: { ...progress, levels: { findLetter: 'hard' }, itemsSeen: 0, rounds: {} },
    })
  })

  it('upgrades a version 4 save (Task 15): every item counts as new, so the map points to "Mina saker" once', () => {
    const progress = { xp: 60, roundsCompleted: 3, completedLevels: [], levels: {}, unlockedItems: ['cap', 'beanie'], worn: {}, mastery: {} }
    const version4 = { version: 4, savedAt: '2026-10-24T09:00:00.000Z', progress }
    expect(readSave(version4)).toEqual({ kind: 'loaded', repaired: false, progress: { ...progress, itemsSeen: 0, rounds: {} } })
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
    expect(result.progress.unlockedItems).toEqual(playedProgress().unlockedItems)
    expect(result.progress.worn).toEqual({ head: 'cap' })
    expect(result.progress.completedLevels).toEqual(['findLetter:easy', 'firstLetter:easy'])
  })

  it('never accepts negative, fractional or huge numbers', () => {
    for (const xp of [-5, 2.5, Number.NaN, Infinity, 2 ** 60]) {
      const file = stored(playedProgress()) as { progress: Record<string, unknown> }
      file.progress.xp = xp
      expect(readSave(file)).toMatchObject({ kind: 'loaded', repaired: true, progress: { xp: 0 } })
    }
  })

  it('never counts more items as seen than there are', () => {
    const saved = stored({ ...playedProgress(), itemsSeen: 99 })
    const loaded = readSave(saved)
    if (loaded.kind !== 'loaded') throw new Error(loaded.kind)
    expect(loaded.progress.itemsSeen).toBe(loaded.progress.unlockedItems.length)
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

  it('takes off a worn item that is not unlocked, unknown, or in the wrong slot', () => {
    for (const worn of [{ head: 'crown' }, { head: 'dragon' }, { top: 'cap' }, 'cap']) {
      const file = stored(playedProgress()) as { progress: Record<string, unknown> }
      file.progress.worn = worn
      expect(readSave(file), JSON.stringify(worn)).toMatchObject({ kind: 'loaded', repaired: true, progress: { worn: {} } })
    }
  })

  it('drops levels a station does not have, and keeps the rest', () => {
    const file = stored(playedProgress()) as { progress: Record<string, unknown> }
    file.progress.levels = { findLetter: 'hard', wordPicture: 'hard', dragons: 'easy', firstLetter: 'impossible' }
    expect(readSave(file)).toMatchObject({ kind: 'loaded', repaired: true, progress: { levels: { findLetter: 'hard' } } })
  })

  it('drops mastery for unknown letters, words or boxes, and keeps the rest', () => {
    const file = stored(playedProgress()) as { progress: { mastery: Record<string, unknown> } }
    file.progress.mastery['findLetter:q'] = 3
    file.progress.mastery['wordPicture:sun'] = 9
    file.progress.mastery['firstLetter:moon'] = 'lots'
    const result = readSave(file)
    expect(result).toMatchObject({ kind: 'loaded', repaired: true })
    if (result.kind !== 'loaded') return
    expect(result.progress.mastery).toEqual({ 'findLetter:a': 2, 'firstLetter:sun': 1 })
  })

  it('plays a save from a newer version of the game but marks it, so it is never overwritten', () => {
    const file = stored(playedProgress()) as { version: number; progress: Record<string, unknown> }
    file.version = saveVersion + 1
    file.progress.pets = ['dragon']
    const result = readSave(file)
    expect(result.kind).toBe('newer')
    expect(result).toMatchObject({ progress: { unlockedItems: playedProgress().unlockedItems, worn: { head: 'cap' } } })
  })
})
