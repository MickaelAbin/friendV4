import type { Request, Response } from 'express'
import { StatsService } from '../services/stats.service.js'

export class StatsController {
  static async getHistoryStats(req: Request, res: Response) {
    try {
      const stats = await StatsService.getHistoryStats()
      res.set('Cache-Control', 'no-store')
      res.json(stats)
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Erreur lors de la recupération des statistiques." })
    }
  }
}
