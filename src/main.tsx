import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { reviewingVoices } from './app/reviewMode'
import { Root } from './app/Root'
import { setupTouchBehaviour } from './app/touchBehaviour'
import { registerServiceWorker } from './pwa/registerServiceWorker'
import { loadProgress } from './rewards/store'
import { initSpeech } from './speech/speech'
import { loadHubGame } from './world/loadHubGame'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing #root element')
}

setupTouchBehaviour()
initSpeech()
registerServiceWorker()

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

if (!reviewingVoices) {
  void loadProgress()
  // Fetch the map while the start screen shows, so it opens straight away on Spela.
  void loadHubGame()
}
