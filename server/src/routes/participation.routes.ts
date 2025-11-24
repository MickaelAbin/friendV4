import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { ParticipationController } from '../controllers/participation.controller.js'

const router = Router()

router.use(authenticate)

router.post('/:sessionId/respond', ParticipationController.respond)
router.post('/:sessionId/join', ParticipationController.join)

export default router

