import apiClient from './client'

export interface User {
  id: number
  username: string
  displayName: string
  email: string
}

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await apiClient.get('/api/users')
  return data
}
