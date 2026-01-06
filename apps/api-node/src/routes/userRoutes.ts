import express, { Router } from 'express'
import {
  getUserByIdController,
  createUserController,
  deleteUserController,
  updateUserByIdController,
  getSessionByIdController,
} from '../controllers/userController.js'

const router: Router = express.Router()
router.get('/:id', getUserByIdController)
router.post('/', createUserController)
router.delete('/:id', deleteUserController)
router.put('/:id', updateUserByIdController)
router.get('/sessions/:id', getSessionByIdController)

export default router
