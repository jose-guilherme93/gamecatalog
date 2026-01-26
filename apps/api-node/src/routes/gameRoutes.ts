import express, { Router } from 'express'

import { createGameController, getAllGames, getGameByIdController, searchGame, updateGameController } from '../controllers/gameController.js'

const router: Router = express.Router()

router.post('/search-game', searchGame)
router.get('/:id', getGameByIdController)
router.get('/', getAllGames)
router.post('/', createGameController)
router.put('/:id', updateGameController)
export default router
