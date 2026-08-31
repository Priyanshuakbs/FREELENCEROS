import axios from 'axios'

const DEFAULT_API_URL = 'https://freelenceros.onrender.com/api'

let envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
let rawBaseURL = DEFAULT_API_URL;

if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
  const cleanOrigin = envUrl.replace(/(\/api|\/auth)+$/i, '').replace(/\/+$/, '');
  rawBaseURL = `${cleanOrigin}/api`;
}

const api = axios.create({
  baseURL: rawBaseURL,
})

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
      if (path.startsWith('/portfolio') || path.startsWith('/freelancers') || path.startsWith('/proposal-accepted') || path.startsWith('/portal')) {
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
