/** A short rolling log of speech events for the ?debug=voices panel. */
export interface EventLog {
  note(event: string): void
  entries(): string[]
}

export function createEventLog(size = 30): EventLog {
  const events: string[] = []
  const startedAt = Date.now()
  return {
    note(event) {
      events.push(`${((Date.now() - startedAt) / 1000).toFixed(1)}s ${event}`)
      if (events.length > size) events.shift()
    },
    entries: () => [...events],
  }
}
