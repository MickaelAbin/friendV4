import type { Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import { GameService } from "../services/game.service"

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
    const games = await GameService.searchExternal(query)
    res.json(games)
  }

  static async save(req: Request, res: Response) {
    const game = await GameService.saveGame(req.body)
    res.status(StatusCodes.CREATED).json(game)
  }
}
