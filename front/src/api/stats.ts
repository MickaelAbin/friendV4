import apiClient from './client'

export interface HistoryStats {
  topUsers: Array<{
    id: number
    name: string
    points: string
    rank: number
    avatar: string
  }>
  recentHistory: Array<{
    id: number
    game: string
    date: string
    players: number
    cover: string
    winner: string
    winnerAvatar: string
  }>
  sessionSummary: {
    totalSessions: number
    winRatio: string
    hoursPlayed: string
    quote: string
  }
  achievements: Array<{
    id: number
    title: string
    desc: string
    icon: string
    locked: boolean
  }>
}

export const fetchHistoryStats = async (): Promise<HistoryStats> => {
  const { data } = await apiClient.get('/api/stats/history')
  return data
}
