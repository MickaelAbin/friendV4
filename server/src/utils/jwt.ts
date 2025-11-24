import jwt from 'jsonwebtoken'
import type { JwtPayload as LibJwtPayload } from 'jsonwebtoken'
import { env } from '../config/env'

export const signToken = (userId: number) => {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions)
}

export const verifyToken = (token: string): { sub: number } => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as string | LibJwtPayload
  let sub: unknown
  if (typeof decoded === 'string') {
    try {
      const obj = JSON.parse(decoded) as { sub?: unknown }
      sub = obj.sub
    } catch {
      sub = undefined
    }
  } else {
    sub = decoded.sub
  }
  const numSub = typeof sub === 'string' ? Number(sub) : sub
  if (typeof numSub !== 'number' || Number.isNaN(numSub)) {
    throw new Error('Invalid token payload')
  }
  return { sub: numSub }
}

