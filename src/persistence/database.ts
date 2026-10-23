/** The game's IndexedDB database: saves keyed by profile id, and copies of saves that had to be repaired. */
export const databaseName = 'larrutan'
export const profileStore = 'profiles'
export const backupStore = 'backups'

/** IndexedDB can hang in Safari; the game must start anyway, just without saving. */
const openLimitMs = 3000

let opening: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('IndexedDB did not open in time')), openLimitMs)
    const request = indexedDB.open(databaseName, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(profileStore)
      request.result.createObjectStore(backupStore)
    }
    request.onsuccess = () => {
      clearTimeout(timer)
      resolve(request.result)
    }
    request.onerror = () => {
      clearTimeout(timer)
      reject(request.error ?? new Error('IndexedDB could not open'))
    }
  })
  return opening
}

export async function readRecord(store: string, key: string): Promise<unknown> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
  })
}

export async function writeRecord(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    transaction.objectStore(store).put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted'))
  })
}
