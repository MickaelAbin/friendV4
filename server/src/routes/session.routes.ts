import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { SessionController } from '../controllers/session.controller'

const router = Router()

router.use(authenticate)

router.get('/', SessionController.list)
router.get('/:id', SessionController.get)
router.post('/', SessionController.create)
router.put('/:id', SessionController.update)
router.post('/:id/results', SessionController.recordResults)

export default router

