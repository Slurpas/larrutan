import { useEffect, useState } from 'react'
import { getSpeechDebugInfo, speak, unlockSpeech } from './speech'
import styles from './VoiceDebug.module.css'

/** Shown when the game is opened with ?debug=voices. */
export const voiceDebugRequested = new URLSearchParams(window.location.search).get('debug') === 'voices'

/** For adults and debugging: which voices the device offers, which one the game uses, and what happened to each sentence. */
export function VoiceDebug() {
  const [info, setInfo] = useState(getSpeechDebugInfo)

  useEffect(() => {
    const timer = setInterval(() => setInfo(getSpeechDebugInfo()), 500)
    return () => clearInterval(timer)
  }, [])

  function handleTest() {
    unlockSpeech()
    void speak('Hej! Var är A?')
  }

  return (
    <aside className={styles.panel} aria-label="Voice diagnostics">
      <strong>Voice diagnostics</strong>
      <dl className={styles.facts}>
        <dt>Status</dt>
        <dd>{info.status}</dd>
        <dt>Voice in use</dt>
        <dd>{info.chosenVoice ?? 'none'}</dd>
        <dt>Swedish voices</dt>
        <dd>{info.swedishVoices.length > 0 ? info.swedishVoices.join(', ') : 'none'}</dd>
        <dt>All voices</dt>
        <dd>{info.totalVoices}</dd>
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
