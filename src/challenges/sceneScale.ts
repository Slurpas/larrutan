/**
 * The biggest whole-number zoom at which a game scene (Bubblor, Mata draken, …) fits the
 * screen: pixel art scales by whole numbers only. 4× on an iPad in either orientation.
 */
export function sceneScale(screenWidth: number, screenHeight: number): number {
  return Math.max(2, Math.min(6, Math.floor(Math.min(screenWidth / 200, screenHeight / 170))))
}
