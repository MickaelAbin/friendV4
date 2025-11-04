import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { GameController } from '../controllers/game.controller'

const router = Router()

// Recherche externe accessible sans authentification (lecture seule)
router.get('/search', GameController.searchExternal)
router.get('/thing', GameController.thing)

// Les routes suivantes requièrent une authentification
router.use(authenticate)

router.get('/', GameController.listLocal)
router.post('/', GameController.save)
router.post('/:id/image', GameController.upload.single('image'), GameController.uploadImage)

export default router

