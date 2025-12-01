import express, { Router } from 'express'

import { createDonationPayment } from '@/controllers/paymentController.js'
const route: Router = express.Router()

route.post('/', createDonationPayment)

export default route
