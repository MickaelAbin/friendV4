import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const TOKEN_KEY = 'bgs_token'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    // Ensure headers object exists
    config.headers = config.headers ?? {}
    ;(config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
    }
    return Promise.reject(error)
  }
)

export const setAuthToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token)
  apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
}

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  delete apiClient.defaults.headers.common.Authorization
}

export default apiClient

