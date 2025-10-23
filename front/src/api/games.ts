import apiClient from './client'
import type { Game } from './types'

export const listGames = async (): Promise<Game[]> => {
  const { data } = await apiClient.get<Game[]>('/api/games')
  return data
}

export const searchGames = async (query: string) => {
  const { data } = await apiClient.get<Array<Omit<Game, 'id'> & { id?: number }>>('/api/games/search', {
    params: { q: query }
  })
  return data
}

export const saveGame = async (payload: {
  name: string
  externalId?: string
  apiSource?: string
  averageDuration?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
}) => {
  const { data } = await apiClient.post<Game>('/api/games', payload)
  return data
}

