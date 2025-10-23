import apiClient, { setAuthToken } from './client'
import type { User } from './types'

interface AuthResponse {
  token: string
  user: User
}

export const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload)
  return data
}

export const register = async (payload: {
  username: string
  displayName: string
  email: string
  password: string
}): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload)
  return data
}

export const getProfile = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/api/auth/me')
  return data
}

export const bootstrapAuth = async () => {
  const token = localStorage.getItem('bgs_token')
  if (token) {
    setAuthToken(token)
    return getProfile()
  }
  return null
}

