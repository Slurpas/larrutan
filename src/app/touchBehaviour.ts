/**
 * Makes the page behave like an app on iPad:
 * - Buttons show their pressed (:active) look. iPad Safari only applies
 *   :active when the page has a touchstart listener, so an empty one is added.
 * - Pinch zoom is blocked. Safari ignores user-scalable=no, so its own
 *   gesture events must be cancelled.
 * - The long-press / right-click menu is blocked.
 */
export function setupTouchBehaviour(): void {
  document.addEventListener('touchstart', () => {}, { passive: true })

  const prevent = (event: Event) => event.preventDefault()
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
  document.addEventListener('contextmenu', prevent)
}
