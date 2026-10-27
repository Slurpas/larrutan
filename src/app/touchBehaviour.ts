/**
 * Makes the page behave like an app on iPad:
 * - Buttons show their pressed (:active) look. iPad Safari only applies
 *   :active when the page has a touchstart listener, so an empty one is added.
 * - Pinch zoom is blocked. Safari ignores user-scalable=no, so its own
 *   gesture events must be cancelled.
 * - The long-press / right-click menu is blocked.
 * - What can be dragged (cards, cookies, the mower's lawn) is marked `data-drag`. A moving
 *   touch there is the page's: iPad Safari would otherwise take it over to pan or bounce the
 *   page and cancel the drag, even with touch-action: none (the user couldn't drag cards
 *   on the iPad, only tap one pile and then another, 2026-10-27).
 */
export function setupTouchBehaviour(): void {
  document.addEventListener('touchstart', () => {}, { passive: true })

  const prevent = (event: Event) => event.preventDefault()
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
  document.addEventListener('contextmenu', prevent)
  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.target instanceof Element && event.target.closest('[data-drag]')) event.preventDefault()
    },
    { passive: false },
  )
}
