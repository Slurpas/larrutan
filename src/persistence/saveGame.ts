import type { Progress } from '../rewards/progress'
import { backupStore, profileStore, readRecord, writeRecord } from './database'
import { readSave, toSaveFile, type ReadResult } from './saveFile'

/** The only profile for now. Saves are keyed by profile so more can be added later (PRD §12). */
const profileId = 'default'

/** `failed`: the save couldn't be read, so the game plays without saving rather than risk overwriting it. */
export type LoadResult = ReadResult | { kind: 'failed' }

export async function loadSavedProgress(): Promise<LoadResult> {
  try {
    const stored = await readRecord(profileStore, profileId)
    const result = readSave(stored)
    if (result.kind === 'loaded' && result.repaired) {
      // Keep the broken save, so a bug in the game can never destroy progress for good,
      // then store the repaired one so the next start doesn't repair (and back up) again.
      await writeRecord(backupStore, `${profileId} ${new Date().toISOString()}`, stored)
      await writeRecord(profileStore, profileId, toSaveFile(result.progress, new Date()))
    }
    return result
  } catch (error) {
    console.warn('Could not read the saved game; playing without saving.', error)
    return { kind: 'failed' }
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  try {
    await writeRecord(profileStore, profileId, toSaveFile(progress, new Date()))
    requestPersistentStorage()
  } catch (error) {
    console.warn('Could not save the game.', error)
  }
}

let persistenceRequested = false

/**
 * Asks the browser not to clear the save when space runs low. Only in the installed app:
 * that is where it matters (PRD §12), and some browsers would otherwise show a question a child can't answer.
 */
function requestPersistentStorage() {
  if (persistenceRequested) return
  persistenceRequested = true
  if (!isInstalledApp() || !navigator.storage?.persist) return
  navigator.storage.persist().catch(() => {})
}

function isInstalledApp(): boolean {
  const iosHomeScreen = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosHomeScreen || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches
}
