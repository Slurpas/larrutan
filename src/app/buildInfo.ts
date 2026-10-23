/** Set by vite.config.ts when the game is built. */
declare const __BUILD_TIME__: string

/** "Version 23 okt. 14:05" in a release build, so it's easy to see whether the iPad has the latest one. */
export const versionLabel: string | null = import.meta.env.PROD
  ? `Version ${new Date(__BUILD_TIME__).toLocaleString('sv-SE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
  : null
