import { test as base } from '@playwright/test'

export { expect } from '@playwright/test'

/**
 * Makes sound impossible in the tests: they run real browsers next to the user, and the
 * game's speech came out of their speakers, dozens of clips per second (user feedback
 * 2026-10-23, twice). Muting was not enough (WebKit on Windows even starts loaded clips
 * a little by itself), so audio never reaches the browser's media engine at all:
 * - An audio element keeps its clip address to itself; the browser never loads the clip.
 * - play() checks that the clip can be fetched (offline: from the service worker's
 *   cache), then reports playing and, a moment later, ended.
 * - The device voice never speaks; it reports start and end.
 * The game sees the same events as in real playback, so the tests still check the flow.
 */
function fakeAudio() {
  const clipLength = 1000
  const playing = new WeakSet<HTMLMediaElement>()
  const turn = new WeakMap<HTMLMediaElement, number>()
  const sources = new WeakMap<HTMLMediaElement, string>()
  const fire = (element: EventTarget, type: string) => element.dispatchEvent(new Event(type))

  Object.defineProperty(HTMLMediaElement.prototype, 'src', {
    configurable: true,
    get(this: HTMLMediaElement) {
      return sources.get(this) ?? ''
    },
    set(this: HTMLMediaElement, value: string) {
      sources.set(this, new URL(value, location.href).href)
    },
  })
  // `new Audio(url)` would hand the url to the browser directly.
  const FakeAudio = function (src?: string) {
    const element = document.createElement('audio')
    if (src !== undefined) element.src = src
    return element
  } as unknown as typeof Audio
  FakeAudio.prototype = HTMLAudioElement.prototype
  window.Audio = FakeAudio

  Object.defineProperty(HTMLMediaElement.prototype, 'paused', {
    configurable: true,
    get(this: HTMLMediaElement) {
      return !playing.has(this)
    },
  })

  const play = (element: HTMLMediaElement): Promise<void> => {
    const myTurn = (turn.get(element) ?? 0) + 1
    turn.set(element, myTurn)
    element.muted = true
    const current = () => turn.get(element) === myTurn
    return fetch(element.src).then(
      (response) => {
        if (!response.ok) throw new Error(`clip ${response.status}`)
        if (!current()) return
        playing.add(element)
        fire(element, 'play')
        fire(element, 'playing')
        setTimeout(() => {
          if (!current()) return
          playing.delete(element)
          fire(element, 'ended')
        }, clipLength)
      },
      () => {
        if (current()) fire(element, 'error')
        throw new DOMException('The clip could not be loaded', 'NotSupportedError')
      },
    )
  }
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    return play(this)
  }

  HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
    turn.set(this, (turn.get(this) ?? 0) + 1)
    if (!playing.delete(this)) return
    fire(this, 'pause')
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      setTimeout(() => {
        fire(utterance, 'start')
        fire(utterance, 'end')
      }, 0)
    }
  }
}

/** Use this `test` in every spec (an ESLint rule enforces it), so no test can make a sound. */
export const test = base.extend<{ silence: void }>({
  silence: [
    async ({ context }, use) => {
      await context.addInitScript(fakeAudio)
      await use()
    },
    { auto: true },
  ],
})
