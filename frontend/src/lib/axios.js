import axios from 'axios'

let envUrl = import.meta.env.VITE_API_URL;
let rawBaseURL = (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) 
  ? envUrl 
  : 'https://freelenceros.onrender.com/api';

if (!rawBaseURL.endsWith('/api') && !rawBaseURL.endsWith('/api/')) {
  rawBaseURL = rawBaseURL.endsWith('/') ? `${rawBaseURL}api` : `${rawBaseURL}/api`;
}

const api = axios.create({
  baseURL: rawBaseURL,
})

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('auth-storage') || '{}')
  const token = auth?.state?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear storage
      localStorage.removeItem('auth-storage')
      // Redirect
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
