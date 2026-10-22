import { useEffect, useState } from 'react'
import { voiceTestPhrase } from './catalogue'
import { getSpeechDebugInfo, speak, unlockSpeech } from './speech'
import styles from './VoiceDebug.module.css'

/** Shown when the game is opened with ?debug=voices. */
export const voiceDebugRequested = new URLSearchParams(window.location.search).get('debug') === 'voices'

/** For adults and debugging: where the game's speech comes from, and what happened to each sentence. */
export function VoiceDebug() {
  const [info, setInfo] = useState(getSpeechDebugInfo)

  useEffect(() => {
    const timer = setInterval(() => setInfo(getSpeechDebugInfo()), 500)
    return () => clearInterval(timer)
  }, [])

  function handleTest() {
    unlockSpeech()
    void speak(voiceTestPhrase)
  }

  return (
    <aside className={styles.panel} aria-label="Speech diagnostics">
      <strong>Speech diagnostics</strong>
      <dl className={styles.facts}>
        <dt>Audio clips</dt>
        <dd>{info.clipCount} generated</dd>
        <dt>Device voice</dt>
        <dd>
          {info.device.status}: {info.device.chosenVoice ?? 'none'}
        </dd>
        <dt>Swedish device voices</dt>
        <dd>{info.device.swedishVoices.length > 0 ? info.device.swedishVoices.join(', ') : 'none'}</dd>
        <dt>All device voices</dt>
        <dd>{info.device.totalVoices}</dd>
      </dl>
      <button type="button" className={styles.test} onClick={handleTest}>
        Test the voice
      </button>
      <ol className={styles.events} reversed>
        {[...info.events].reverse().map((event, index) => (
          <li key={`${info.events.length - index}-${event}`}>{event}</li>
        ))}
      </ol>
    </aside>
  )
}
