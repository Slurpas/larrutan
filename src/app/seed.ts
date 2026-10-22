/** A ?seed=123 in the address replays a reported round; tests use it too. */
export function readSeedFromUrl(search: string): number | null {
  const value = new URLSearchParams(search).get('seed')
  if (value === null || !/^\d{1,9}$/.test(value)) return null
  return Number(value)
}

/** Short enough for a parent to read out from the corner of the screen. */
export function randomSeed(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % 1_000_000
}
