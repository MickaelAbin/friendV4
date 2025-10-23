import axios from 'axios'
import { prisma } from '../utils/prisma'
import { env } from '../config/env'

export class GameService {
  static async listLocal() {
    return prisma.game.findMany({
      orderBy: { name: 'asc' }
    })
  }

  static async searchExternal(query: string) {
    if (!env.BOARD_GAME_API_URL || !env.BOARD_GAME_API_CLIENT_ID) {
      return []
    }

    const response = await axios.get(env.BOARD_GAME_API_URL, {
      params: {
        name: query,
        client_id: env.BOARD_GAME_API_CLIENT_ID
      }
    })
    const games = response.data.games ?? []
    return games.map((game: any) => ({
      name: game.name,
      externalId: game.id,
      apiSource: 'boardgameatlas',
      minPlayers: game.min_players ?? null,
      maxPlayers: game.max_players ?? null,
      averageDuration: game.playtime ?? null
    }))
  }

  static async saveGame(data: {
    name: string
    externalId?: string
    apiSource?: string
    averageDuration?: number | null
    minPlayers?: number | null
    maxPlayers?: number | null
  }) {
    if (data.externalId) {
      return prisma.game.upsert({
        where: { externalId: data.externalId },
        create: {
          name: data.name,
          externalId: data.externalId,
          apiSource: data.apiSource,
          averageDuration: data.averageDuration ?? null,
          minPlayers: data.minPlayers ?? null,
          maxPlayers: data.maxPlayers ?? null
        },
        update: {
          name: data.name,
          apiSource: data.apiSource,
          averageDuration: data.averageDuration ?? null,
          minPlayers: data.minPlayers ?? null,
          maxPlayers: data.maxPlayers ?? null
        }
      })
    }

    return prisma.game.create({
      data: {
        name: data.name,
        apiSource: data.apiSource,
        averageDuration: data.averageDuration ?? null,
        minPlayers: data.minPlayers ?? null,
        maxPlayers: data.maxPlayers ?? null
      }
    })
  }
}
