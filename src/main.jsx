import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { StoreProvider } from './lib/store'

// After a new deploy, an open tab may ask for code files that no longer exist.
// Reload once to pick up the new version instead of showing a blank screen.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('saafsnap.reloadedAt') || 0)
    if (Date.now() - last < 10000) return
    sessionStorage.setItem('saafsnap.reloadedAt', String(Date.now()))
  } catch {
    /* storage blocked: still reload once */
  }
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
