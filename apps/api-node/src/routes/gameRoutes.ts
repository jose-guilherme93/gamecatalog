import express, { Router } from 'express'
import {
    createGameController,
    getAllGames,
    getGameByIdController,
    updateGameController,
    upsertGameController,
    searchGame,
    createGameSchema,
    updateGameSchema,
    gameParamsSchema,
    getAllGamesSchema,
    searchGameSchema,
} from '../controllers/gameController.js'
import { validateRequest } from '../utils/middlewares/validateRequest.js'

const router: Router = express.Router()

router.get('/', validateRequest(getAllGamesSchema), getAllGames)
router.get('/search', validateRequest(searchGameSchema), searchGame)
router.get('/:id', validateRequest(gameParamsSchema), getGameByIdController)
router.post('/', validateRequest(createGameSchema), createGameController)
router.post('/upsert', validateRequest(createGameSchema), upsertGameController)
router.put('/:id', validateRequest(updateGameSchema), updateGameController)

export default router
