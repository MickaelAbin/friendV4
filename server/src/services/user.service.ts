import { prisma } from "../utils/prisma.js"

export class UserService {
  static async list() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        displayName: 'asc'
      }
    })
  }
}
