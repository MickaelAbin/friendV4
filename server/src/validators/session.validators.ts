import { z } from 'zod'

const sessionStatus = z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'])
const invitationStatus = z.enum(['PENDING', 'ACCEPTED', 'DECLINED'])

export const createSessionSchema = z.object({
  title: z.string().min(3).max(255),
  // Accepte la valeur issue d'un input type="datetime-local" (ex: 2025-11-03T14:30)
  // La conversion vers Date est faite dans le service.
  startDatetime: z.string().min(1),
  location: z.string().min(1).max(255),
  status: sessionStatus.optional(),
  games: z
    .array(
      z.object({
        gameId: z.number().int().positive(),
        order: z.number().int().min(1)
      })
    )
    .optional(),
  participants: z
    .array(
      z.object({
        userId: z.number().int().positive(),
        statusInvitation: invitationStatus.optional()
      })
    )
    .optional()
})

export const updateSessionSchema = createSessionSchema.partial()

export const recordResultsSchema = z.object({
  sessionGameId: z.number().int().positive(),
  results: z.array(
    z.object({
      userId: z.number().int().positive(),
      score: z.number().int(),
      playerRank: z.number().int().min(1)
    })
  )
})

export const respondParticipationSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED'])
})
