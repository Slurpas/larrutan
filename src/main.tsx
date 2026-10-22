import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'
import { blockBrowserGestures } from './app/blockBrowserGestures'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Missing #root element')
}

blockBrowserGestures()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
