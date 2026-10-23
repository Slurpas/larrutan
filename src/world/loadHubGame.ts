/**
 * The map's game code, loaded on its own: Phaser is most of the app's size, so the
 * start screen appears without it and it downloads while the child looks at that.
 */
export function loadHubGame() {
  return import('./hubGame')
}
