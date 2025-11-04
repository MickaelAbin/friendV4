import apiClient from './client'
import type { Game } from './types'

export const listGames = async (): Promise<Game[]> => {
  const { data } = await apiClient.get<Game[]>('/api/games')
  return data
}

export const searchGames = async (query: string) => {
  const { data } = await apiClient.get<Array<Omit<Game, 'id'> & { id?: number }>>('/api/games/search', {
    params: { q: query, fast: 1 }
  })
  return data
}

export const fetchGameThing = async (externalId: string) => {
  const { data } = await apiClient.get<{ name: string; minPlayers: number | null; maxPlayers: number | null; averageDuration: number | null; thumbnailUrl?: string | null }>(
    '/api/games/thing',
    { params: { externalId } }
  )
  return data
}

export const saveGame = async (payload: {
  name: string
  externalId?: string
  apiSource?: string
  averageDuration?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
  imageUrl?: string | null
}) => {
  // Enrichir via BGG thing si externalId fourni (remplit min/max/duree/image)
  let enriched = {}
  if (payload.externalId) {
    try {
      const { data } = await apiClient.get('/api/games/thing', { params: { externalId: payload.externalId } })
      if (data) {
        enriched = {
          averageDuration: data.averageDuration ?? null,
          minPlayers: data.minPlayers ?? null,
          maxPlayers: data.maxPlayers ?? null,
          imageUrl: data.thumbnailUrl ?? null
        }
      }
    } catch {
      // silencieux: on garde les valeurs fournies si l'enrichissement echoue
    }
  }

  // Ne pas envoyer de cles inconnues (ex: id provenant de l'API externe)
  const body = {
    name: payload.name,
    externalId: payload.externalId ?? undefined,
    apiSource: payload.apiSource ?? undefined,
    averageDuration: (enriched as any).averageDuration ?? payload.averageDuration ?? null,
    minPlayers: (enriched as any).minPlayers ?? payload.minPlayers ?? null,
    maxPlayers: (enriched as any).maxPlayers ?? payload.maxPlayers ?? null,
    imageUrl: (enriched as any).imageUrl ?? payload.imageUrl ?? undefined
  }
  const { data } = await apiClient.post<Game>('/api/games', body)
  return data
}

