import { StatusCodes } from 'http-status-codes'
import { prisma } from '../utils/prisma'
import { AppError } from '../utils/appError'

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
        statusInvitation: status,
        responseDate: new Date()
      }
    })
  }
}

