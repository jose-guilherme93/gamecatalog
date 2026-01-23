import express, { Router } from 'express'
import { loginController } from '../controllers/auth/login.js'
import { recoveryController } from '../controllers/auth/recovery.js'
import { resetPasswordController } from '../controllers/auth/resetPassword.js'

const router: Router = express.Router()

router.post('/login', loginController)
router.post('/recovery', recoveryController)
router.post('/reset-password', resetPasswordController)

export default router
