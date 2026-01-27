import express, { Router } from 'express'
import {
  getUserByIdController,
  createUserController,
  deleteUserController,
  updateUserByIdController,
  getSessionByIdController,
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
} from '../controllers/userController.js'
import { validateRequest } from '../utils/middlewares/validateRequest.js'

const router: Router = express.Router()

router.get('/:id', validateRequest(userParamsSchema), getUserByIdController)
router.post('/', validateRequest(createUserSchema), createUserController)
router.delete('/:id', validateRequest(userParamsSchema), deleteUserController)
router.put('/:id', validateRequest(updateUserSchema), updateUserByIdController)
router.get('/sessions/:id', validateRequest(userParamsSchema), getSessionByIdController)

export default router
