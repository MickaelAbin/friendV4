import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate.js'
import { UserController } from '../controllers/user.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', UserController.list)

export default router
