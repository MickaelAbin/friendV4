import apiClient from './client'
import type { Session } from './types'

export const fetchSessions = async (): Promise<Session[]> => {
  const { data } = await apiClient.get<Session[]>('/api/sessions')
  return data
}

export const fetchSession = async (id: number): Promise<Session> => {
  const { data } = await apiClient.get<Session>(`/api/sessions/${id}`)
  return data
}

export const createSession = async (payload: {
  title: string
  startDatetime: string
  location: string
  status?: Session['status']
  games?: Array<{ gameId: number; order: number }>
  participants?: Array<{ userId: number; statusInvitation?: Session['participants'][number]['statusInvitation'] }>
}) => {
  const { data } = await apiClient.post<Session>('/api/sessions', payload)
  return data
}

export const updateSession = async (id: number, payload: Partial<Parameters<typeof createSession>[0]>) => {
  const { data } = await apiClient.put<Session>(`/api/sessions/${id}`, payload)
  return data
}

export const recordResults = async (sessionId: number, payload: { sessionGameId: number; results: Array<{ userId: number; score: number; playerRank: number }> }) => {
  const { data } = await apiClient.post<Session>(`/api/sessions/${sessionId}/results`, payload)
  return data
}

export const respondParticipation = async (
  sessionId: number,
  status: 'ACCEPTED' | 'DECLINED'
) => {
  const { data } = await apiClient.post<{ id: number }>(`/api/participations/${sessionId}/respond`, { status })
  return data
}

export const joinSession = async (sessionId: number) => {
  const { data } = await apiClient.post<{ id: number }>(`/api/participations/${sessionId}/join`)
  return data
}

export const fetchDiscoverSessions = async (): Promise<Session[]> => {
  const { data } = await apiClient.get<Session[]>('/api/sessions/discover')
  return data
}

