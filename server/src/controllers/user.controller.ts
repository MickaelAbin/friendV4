import type { Request, Response } from 'express'
import { UserService } from '../services/user.service.js'

export class UserController {
  static async list(req: Request, res: Response) {
    const users = await UserService.list()
    res.set('Cache-Control', 'no-store')
    res.json(users)
  }
}
