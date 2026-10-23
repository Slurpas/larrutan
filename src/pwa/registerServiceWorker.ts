/** Installs the offline cache (src/pwa/serviceWorker.js). Release builds only: in development it would hide code changes. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
      console.warn('The game will not work offline.', error)
    })
  })
}
