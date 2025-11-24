import { StatusCodes } from 'http-status-codes'
import { prisma } from '../utils/prisma.js'
import { AppError } from '../utils/appError.js'

export class ParticipationService {
  static async respond(sessionId: number, userId: number, status: 'ACCEPTED' | 'DECLINED') {
    const participation = await prisma.participation.findUnique({
      where: { sessionId_userId: { sessionId, userId } }
    })
    if (participation == null) {
      throw new AppError('Invitation introuvable', StatusCodes.NOT_FOUND)
    }

    return prisma.participation.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: {
        statusInvitation: status
      }
    })
  }

  static async join(sessionId: number, userId: number) {
    const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { status: true } })
    if (session == null) {
      throw new AppError('Session introuvable', StatusCodes.NOT_FOUND)
    }
    if (!['PLANNED', 'ONGOING'].includes(session.status as any)) {
      throw new AppError('La session n\'est pas ouverte aux inscriptions', StatusCodes.BAD_REQUEST)
    }

    // Create or accept participation
    const existing = await prisma.participation.findUnique({ where: { sessionId_userId: { sessionId, userId } } })
    if (existing != null) {
      if (existing.statusInvitation === 'ACCEPTED') return existing
      return prisma.participation.update({
        where: { sessionId_userId: { sessionId, userId } },
        data: { statusInvitation: 'ACCEPTED' }
      })
    }
    return prisma.participation.create({
      data: { sessionId, userId, statusInvitation: 'ACCEPTED' }
    })
  }
}

