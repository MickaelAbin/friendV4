import type { Request, Response } from 'express'
import { ParticipationService } from '../services/participation.service'
import { respondParticipationSchema } from '../validators/session.validators'

export class ParticipationController {
  static async respond(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId)
    const { status } = respondParticipationSchema.parse(req.body)
    const participation = await ParticipationService.respond(sessionId, req.currentUser!.id, status)
    res.json(participation)
  }

  static async join(req: Request, res: Response) {
    const sessionId = Number(req.params.sessionId)
    const participation = await ParticipationService.join(sessionId, req.currentUser!.id)
    res.json(participation)
  }
}
