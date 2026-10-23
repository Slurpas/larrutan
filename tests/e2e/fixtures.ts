import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

/**
 * Silences every page before the game loads: the tests play real speech and sounds,
 * dozens per second, and they would come out of the user's speakers (user feedback
 * 2026-10-23). Clips and sound effects are muted when they start; the device voice
 * speaks at volume 0. Playback itself still happens, so the tests still check it.
 */
function muteAudio() {
  const play = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    this.muted = true
    return play.call(this)
  }
  if ('speechSynthesis' in window) {
    const speak = window.speechSynthesis.speak.bind(window.speechSynthesis)
    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      utterance.volume = 0
      speak(utterance)
    }
  }
}

/** Use this `test` in every spec (an ESLint rule enforces it), so no test can make a sound. */
export const test = base.extend<{ silence: void }>({
  silence: [
    async ({ context }, use) => {
      await context.addInitScript(muteAudio)
      await use()
    },
    { auto: true },
  ],
})
