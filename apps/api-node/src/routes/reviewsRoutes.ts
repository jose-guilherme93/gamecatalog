import express, { Router } from 'express'
import {
  createReviewController,
  deleteReviewController,
  getReviewByGameIdController,
  getReviewsByUserIdController,
  updateReviewController,
  createReviewSchema,
  deleteReviewSchema,
  reviewGameParamsSchema,
  reviewUserParamsSchema,
  updateReviewSchema,
} from '../controllers/reviewController.js'
import { validateRequest } from '../utils/middlewares/validateRequest.js'

const router: Router = express.Router()

router.get('/user/:user_id', validateRequest(reviewUserParamsSchema), getReviewsByUserIdController)
router.get('/game/:game_id', validateRequest(reviewGameParamsSchema), getReviewByGameIdController)
router.post('/', validateRequest(createReviewSchema), createReviewController)
router.delete('/:user_id/:game_id', validateRequest(deleteReviewSchema), deleteReviewController)
router.put('/:user_id/:game_id', validateRequest(updateReviewSchema), updateReviewController)

export default router
