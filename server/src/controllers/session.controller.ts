import type { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { SessionService } from '../services/session.service'
import { createSessionSchema, updateSessionSchema, recordResultsSchema } from '../validators/session.validators'

export class SessionController {
  private static normalize(session: any) {
    if (session == null) return session
    const { participations, ...rest } = session as any
    return {
      ...rest,
      participants: participations
    }
  }
  static async list(req: Request, res: Response) {
    const sessions = await SessionService.list(req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.json(sessions.map((s) => SessionController.normalize(s)))
  }

  static async discover(req: Request, res: Response) {
    const sessions = await SessionService.discover(req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.json(sessions.map((s) => SessionController.normalize(s)))
  }

  static async get(req: Request, res: Response) {
    const sessionId = Number(req.params.id)
    const session = await SessionService.findById(sessionId, req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.json(SessionController.normalize(session))
  }

  static async create(req: Request, res: Response) {
    const payload = createSessionSchema.parse(req.body)
    const session = await SessionService.create(payload, req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.status(StatusCodes.CREATED).json(SessionController.normalize(session))
  }

  static async update(req: Request, res: Response) {
    const payload = updateSessionSchema.parse(req.body)
    const sessionId = Number(req.params.id)
    const session = await SessionService.update(sessionId, payload, req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.json(SessionController.normalize(session))
  }

  static async recordResults(req: Request, res: Response) {
    const payload = recordResultsSchema.parse(req.body)
    const sessionId = Number(req.params.id)
    const session = await SessionService.recordResults(sessionId, payload, req.currentUser!.id)
    res.set('Cache-Control', 'no-store')
    res.json(SessionController.normalize(session))
  }
}

