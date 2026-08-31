import axios from 'axios'

// Always use the correct backend API base URL.
// In development, VITE_API_URL can be set to http://localhost:5000/api
// In production, falls back to the live Render backend.
const PROD_API_URL = 'https://freelenceros.onrender.com/api'

const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

// Derive a clean baseURL: strip any accidental /api or /auth suffix from env var,
// then always append /api — OR just use localhost URL as-is when in dev mode.
let baseURL
if (envUrl && envUrl.startsWith('http://localhost')) {
  // Local dev: use the env var directly (already has /api)
  baseURL = envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`
} else {
  // Production: always use hardcoded correct URL — ignore env var completely
  baseURL = PROD_API_URL
}

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
  const clientAuth = JSON.parse(localStorage.getItem('client-auth-storage') || '{}')

  const token = auth?.state?.token
  const clientToken = clientAuth?.state?.token

  // Choose token depending on request route or available session
  if (clientToken && (config.url.includes('/client') || !token)) {
    config.headers.Authorization = `Bearer ${clientToken}`
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const path = window.location.pathname
      if (
        path.startsWith('/portfolio') ||
        path.startsWith('/freelancers') ||
        path.startsWith('/proposal-accepted') ||
        path.startsWith('/portal')
      ) {
        return Promise.reject(error)
      }
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('client-auth-storage')

      if (path.startsWith('/client')) {
        window.location.href = '/client-login'
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
