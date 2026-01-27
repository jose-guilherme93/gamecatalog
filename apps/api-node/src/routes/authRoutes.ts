import express, { Router } from 'express'
import { validateRequest } from '../utils/middlewares/validateRequest.js'
import { loginController, loginSchema } from '../controllers/auth/login.js'
import { recoveryController, recoverySchema } from '../controllers/auth/recovery.js'
import { resetPasswordController, resetPasswordSchema } from '../controllers/auth/resetPassword.js'

const router: Router = express.Router()

router.post('/login', validateRequest(loginSchema), loginController)
router.post('/recovery', validateRequest(recoverySchema), recoveryController)
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPasswordController)

export default router
