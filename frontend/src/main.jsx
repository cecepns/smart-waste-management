import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import faviconUrl from './assets/logo.png?url'

const faviconLink = document.querySelector('link[rel="icon"]')
if (faviconLink) {
  faviconLink.href = faviconUrl
  faviconLink.type = 'image/png'
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
