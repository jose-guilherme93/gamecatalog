import { getDocs } from '@/controllers/docsController.js'
import express, { Router } from 'express'

const router: Router = express.Router()

router.get('/', getDocs )

export default router
