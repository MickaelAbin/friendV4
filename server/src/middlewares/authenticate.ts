import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '../utils/prisma'
import { verifyToken } from '../utils/jwt'

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentification requise' })
  }

  const [, token] = authHeader.split(' ')
  if (!token) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentification requise' })
  }

  try {
    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (user == null) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Utilisateur inconnu' })
    }
    req.currentUser = user
    next()
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Jeton invalide' })
  }
}

