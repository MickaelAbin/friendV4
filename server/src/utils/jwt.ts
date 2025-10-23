import jwt from 'jsonwebtoken'
import { env } from '../config/env'

interface JwtPayload {
  sub: number
}

export const signToken = (userId: number) => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  })
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

