/**
 * Stops browser gestures that pull a child out of the game: pinch zoom on
 * iPad (Safari ignores user-scalable=no, so its own gesture events must be
 * cancelled) and the long-press / right-click menu.
 */
export function blockBrowserGestures(): void {
  const prevent = (event: Event) => event.preventDefault()

  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
  document.addEventListener('contextmenu', prevent)
}
