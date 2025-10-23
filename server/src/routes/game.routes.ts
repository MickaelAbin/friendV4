import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { GameController } from '../controllers/game.controller'

const router = Router()

router.use(authenticate)

router.get('/', GameController.listLocal)
router.get('/search', GameController.searchExternal)
router.post('/', GameController.save)

export default router

