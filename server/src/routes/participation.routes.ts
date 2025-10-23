import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { ParticipationController } from '../controllers/participation.controller'

const router = Router()

router.use(authenticate)

router.post('/:sessionId/respond', ParticipationController.respond)

export default router

