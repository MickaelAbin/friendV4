import { StatusCodes } from "http-status-codes"
import { prisma } from "../utils/prisma.js"
import { hashPassword, comparePassword } from "../utils/password.js"
import { AppError } from "../utils/appError.js"
import { signToken } from "../utils/jwt.js"

export class AuthService {
  static async register(input: { username: string; displayName: string; email: string; password: string }) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] }
    })
    if (existing !== null) {
      throw new AppError("Email ou nom d'utilisateur deja utilise", StatusCodes.CONFLICT)
    }

    const passwordHash = await hashPassword(input.password)
    const user = await prisma.user.create({
      data: {
        username: input.username,
        displayName: input.displayName,
        email: input.email,
        passwordHash
      }
    })
    return {
      user,
      token: signToken(user.id)
    }
  }

  static async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (user == null) {
      throw new AppError("Identifiants invalides", StatusCodes.UNAUTHORIZED)
    }

    const valid = await comparePassword(input.password, user.passwordHash)
    if (!valid) {
      throw new AppError("Identifiants invalides", StatusCodes.UNAUTHORIZED)
    }

    return {
      user,
      token: signToken(user.id)
    }
  }

  static async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        createdAt: true
      }
    })
    if (user == null) {
      throw new AppError("Utilisateur introuvable", StatusCodes.NOT_FOUND)
    }
    return user
  }
}
