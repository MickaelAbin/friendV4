export interface User {
  id: number
  username: string
  displayName: string
  email: string
  createdAt: string
}

export interface Game {
  id: number
  name: string
  externalId: string
  apiSource: string
  averageDuration: number | null
  minPlayers: number | null
  maxPlayers: number | null
  imageUrl?: string | null
  yearPublished?: number | null
}

export interface SessionGame {
  id: number
  order: number
  gameId: number
  sessionId: number
  game?: Game
  results?: Result[]
}

export interface Session {
  id: number
  title: string
  status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED'
  location: string
  startDatetime: string
  organizerId: number
  organizer?: User
  participants?: Participation[]
  games?: SessionGame[]
}

export interface Participation {
  id: number
  statusInvitation: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  responseDate: string | null
  sessionId: number
  userId: number
  user?: User
}

export interface Result {
  id: number
  score: number
  playerRank: number
  sessionGameId: number
  userId: number
  player?: User
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

