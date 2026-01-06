import express, { Router } from 'express'
import {
  createReviewController,
  deleteReviewController,
  updateReviewController,
  getReviewByGameIdController } from '@/controllers/reviewControler.js'
const router: Router = express.Router()

router.get('/:game_id', getReviewByGameIdController)
router.post('/', createReviewController)
router.delete('/:user_id/:game_id', deleteReviewController)
router.put('/:user_id/:game_id', updateReviewController)
export default router
