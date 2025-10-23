import type { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { registerSchema, loginSchema } from '../validators/auth.validators'
import { StatusCodes } from 'http-status-codes'

export class AuthController {
  static async register(req: Request, res: Response) {
    const payload = registerSchema.parse(req.body)
    const result = await AuthService.register(payload)
    res.status(StatusCodes.CREATED).json({
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        email: result.user.email,
        createdAt: result.user.createdAt
      }
    })
  }

  static async login(req: Request, res: Response) {
    const payload = loginSchema.parse(req.body)
    const result = await AuthService.login(payload)
    res.status(StatusCodes.OK).json({
      token: result.token,
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        email: result.user.email,
        createdAt: result.user.createdAt
      }
    })
  }

  static async profile(req: Request, res: Response) {
    const user = await AuthService.getProfile(req.currentUser!.id)
    res.json(user)
  }
}

