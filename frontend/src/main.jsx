import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const storedTheme = (() => {
  try {
    const raw = localStorage.getItem('theme-storage')
    const parsed = raw ? JSON.parse(raw) : null
    return parsed?.state?.theme || 'dark'
  } catch {
    return 'dark'
  }
})()

document.documentElement.setAttribute('data-theme', storedTheme)
document.documentElement.style.colorScheme = storedTheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
