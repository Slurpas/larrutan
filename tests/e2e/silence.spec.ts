import { expect, test } from './fixtures'

// Uses only the silent clip, so even a broken guard would make no sound.
test('no test can make a sound: clips never really play, and the device voice never speaks', async ({ page }) => {
  await page.goto('/')
  const state = await page.evaluate(async () => {
    const audio = new Audio(`${location.origin}/src/speech/audio/silence.mp3`)
    const events: string[] = []
    for (const type of ['playing', 'ended']) audio.addEventListener(type, () => events.push(type))
    await audio.play()
    const pausedWhilePlaying = audio.paused
    await new Promise((resolve) => setTimeout(resolve, 1300))
    // The browser itself never got the clip: nothing loaded, its clock never moved.
    return { events, pausedWhilePlaying, loaded: audio.networkState !== audio.NETWORK_EMPTY, clock: audio.currentTime }
  })
  expect(state).toEqual({ events: ['playing', 'ended'], pausedWhilePlaying: false, loaded: false, clock: 0 })

  const voice = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        if (!('speechSynthesis' in window)) return resolve('no device voice') // Playwright's WebKit on Windows
        const utterance = new SpeechSynthesisUtterance('Hej')
        utterance.onend = () => resolve(window.speechSynthesis.speaking ? 'spoke' : 'silent')
        window.speechSynthesis.speak(utterance)
      }),
  )
  expect(['silent', 'no device voice']).toContain(voice)
})
