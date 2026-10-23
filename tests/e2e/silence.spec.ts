import { expect, test } from './fixtures'

// Plays only the silent clip, so even a broken guard would make no sound.
test('every sound a test plays is muted', async ({ page }) => {
  await page.goto('/')
  const state = await page.evaluate(async () => {
    const audio = new Audio(`${location.origin}/src/speech/audio/silence.mp3`)
    await audio.play().catch(() => undefined)
    // Playwright's WebKit on Windows has no device voice at all.
    if (!('speechSynthesis' in window)) return { clipMuted: audio.muted, voiceVolume: 0 }
    const utterance = new SpeechSynthesisUtterance('')
    window.speechSynthesis.speak(utterance)
    return { clipMuted: audio.muted, voiceVolume: utterance.volume }
  })
  expect(state).toEqual({ clipMuted: true, voiceVolume: 0 })
})
