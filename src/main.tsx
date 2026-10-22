import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { setupTouchBehaviour } from './app/touchBehaviour'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing #root element')
}

setupTouchBehaviour()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
