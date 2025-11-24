import type { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { GameService } from "../services/game.service"
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs/promises'

export class GameController {
  static async listLocal(_req: Request, res: Response) {
    const games = await GameService.listLocal()
    res.json(games)
  }

  static async searchExternal(req: Request, res: Response) {
    const query = String(req.query.q ?? "")
    if (query.length < 2) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "La recherche doit contenir au moins 2 caracteres" })
    }
    const fast = String(req.query.fast ?? '') === '1'
    const games = fast ? await GameService.searchExternalFast(query) : await GameService.searchExternal(query)
    // Evite le 304/ETag pour des reponses dynamiques; force un rechargement
    res.set('Cache-Control', 'no-store')
    res.json(games)
  }

  static async save(req: Request, res: Response) {
    const game = await GameService.saveGame(req.body)
    res.status(StatusCodes.CREATED).json(game)
  }

  static async thing(req: Request, res: Response) {
    const externalId = String(req.query.externalId ?? '')
    if (!externalId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'externalId requis' })
    }
    const details = await GameService.fetchBggThing(externalId)
    if (!details) {
      return res.status(StatusCodes.OK).json(null)
    }
    return res.json(details)
  }

  // Multer configuration for image uploads
  static upload = multer({
    storage: multer.diskStorage({
      destination: async (req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        try {
          const id = String(req.params.id)
          const dir = path.resolve('uploads', 'games', id)
          await fs.mkdir(dir, { recursive: true })
          cb(null, dir)
        } catch (e) {
          cb(e as Error, '')
        }
      },
      filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const ext = path.extname(file.originalname || '').toLowerCase()
        cb(null, `image${ext || '.jpg'}`)
      }
    }),
    fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowed.includes(file.mimetype)) {
        cb(new Error('Type de fichier non supporte'))
      } else cb(null, true)
    },
    limits: { fileSize: 5 * 1024 * 1024 }
  })

  static async uploadImage(req: Request, res: Response) {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'ID invalide' })
    }
    const file = (req as any).file as Express.Multer.File | undefined
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Aucun fichier fourni' })
    }
    const publicPath = `/uploads/games/${id}/${path.basename(file.path)}`
    const game = await GameService.updateImageUrl(id, publicPath)
    return res.status(StatusCodes.OK).json(game)
  }
}
