import { StatusCodes } from "http-status-codes"
import { prisma } from "../utils/prisma"
import { AppError } from "../utils/appError"
import type { InvitationStatus, SessionStatus } from "@prisma/client"

interface CreateSessionInput {
  title: string
  startDatetime: string
  location: string
  status?: SessionStatus
  games?: Array<{ gameId: number; order: number }>
  participants?: Array<{ userId: number; statusInvitation?: InvitationStatus }>
}

interface UpdateSessionInput extends Partial<CreateSessionInput> { }

export class SessionService {
  static async list(userId: number) {
    return prisma.session.findMany({
      where: {
        OR: [
          { organizerId: userId },
          {
            participations: {
              some: { userId }
            }
          }
        ]
      },
      include: {
        organizer: true,
        games: {
          include: {
            game: true,
            results: {
              include: { player: true }
            }
          }
        },
        participations: {
          include: { user: true }
        }
      },
      orderBy: { startDatetime: "asc" }
    })
  }

  static async discover(userId: number) {
    return prisma.session.findMany({
      where: {
        AND: [
          { organizerId: { not: userId } },
          { status: { in: ["PLANNED", "ONGOING"] } },
          {
            participations: {
              none: { userId }
            }
          }
        ]
      },
      include: {
        organizer: true,
        games: { include: { game: true } },
        participations: { include: { user: true } }
      },
      orderBy: { startDatetime: "asc" }
    })
  }

  static async findById(sessionId: number, userId: number) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        organizer: true,
        games: {
          include: {
            game: true,
            results: {
              include: { player: true }
            }
          }
        },
        participations: {
          include: { user: true }
        }
      }
    })
    if (session == null) {
      throw new AppError("Session introuvable", StatusCodes.NOT_FOUND)
    }
    const hasAccess =
      session.organizerId === userId ||
      session.participations.some((participation: any) => participation.userId === userId)
    if (!hasAccess) {
      throw new AppError("Acces refuse", StatusCodes.FORBIDDEN)
    }
    return session
  }

  static async create(input: CreateSessionInput, organizerId: number) {
    return prisma.session.create({
      data: {
        title: input.title,
        startDatetime: new Date(input.startDatetime),
        location: input.location,
        status: input.status ?? "PLANNED",
        organizerId,
        games: input.games
          ? {
            create: input.games.map((game) => ({
              gameId: game.gameId,
              order: game.order
            }))
          }
          : undefined,
        participations: input.participants
          ? {
            create: input.participants.map((participant) => ({
              userId: participant.userId,
              statusInvitation: participant.statusInvitation ?? "PENDING"
            }))
          }
          : undefined
      },
      include: {
        organizer: true,
        games: { include: { game: true } },
        participations: { include: { user: true } }
      }
    })
  }

  static async update(sessionId: number, input: UpdateSessionInput, userId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId } })
    if (session == null) {
      throw new AppError("Session introuvable", StatusCodes.NOT_FOUND)
    }
    if (session.organizerId !== userId) {
      throw new AppError("Seul l'organisateur peut modifier la session", StatusCodes.FORBIDDEN)
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: {
        title: input.title,
        startDatetime: input.startDatetime ? new Date(input.startDatetime) : undefined,
        location: input.location,
        status: input.status,
        games: input.games
          ? {
            deleteMany: {},
            create: input.games.map((game) => ({
              gameId: game.gameId,
              order: game.order
            }))
          }
          : undefined,
        participations: input.participants
          ? {
            deleteMany: {},
            create: input.participants.map((participant) => ({
              userId: participant.userId,
              statusInvitation: participant.statusInvitation ?? "PENDING"
            }))
          }
          : undefined
      },
      include: {
        organizer: true,
        games: { include: { game: true } },
        participations: { include: { user: true } }
      }
    })

    return updated
  }

  static async recordResults(
    sessionId: number,
    payload: { sessionGameId: number; results: Array<{ userId: number; score: number; playerRank: number }> },
    userId: number
  ) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { organizer: true }
    })
    if (session == null) {
      throw new AppError("Session introuvable", StatusCodes.NOT_FOUND)
    }
    if (session.organizerId !== userId) {
      throw new AppError("Seul l'organisateur peut enregistrer les resultats", StatusCodes.FORBIDDEN)
    }

    const sessionGame = await prisma.sessionGame.findUnique({
      where: { id: payload.sessionGameId },
      include: { session: true }
    })
    if (sessionGame == null || sessionGame.sessionId !== sessionId) {
      throw new AppError("Partie introuvable pour cette session", StatusCodes.BAD_REQUEST)
    }

    await prisma.$transaction([
      prisma.result.deleteMany({
        where: { sessionGameId: payload.sessionGameId }
      }),
      prisma.result.createMany({
        data: payload.results.map((result) => ({
          sessionGameId: payload.sessionGameId,
          userId: result.userId,
          score: result.score,
          playerRank: result.playerRank
        }))
      }),
      prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "FINISHED"
        }
      })
    ])

    return this.findById(sessionId, userId)
  }
}
