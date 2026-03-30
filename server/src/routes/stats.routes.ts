import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { StatsController } from '../controllers/stats.controller.js'

const router = Router()

router.use(authenticate)
router.get('/history', StatsController.getHistoryStats)

export default router
