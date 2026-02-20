import express, { Router } from 'express'
import {
    createDonationPayment,
    checkPaymentDonation,
    handleAbacatePayWebhook,
    createDonationSchema,
    checkPaymentSchema,
    webhookSchema
} from '@/controllers/paymentController.js'
import { validateRequest } from '../utils/middlewares/validateRequest.js'
import { authMiddleware } from '../utils/middlewares/auth.js'

const route: Router = express.Router()

route.post('/', authMiddleware, validateRequest(createDonationSchema), createDonationPayment)
route.post('/payment-check', authMiddleware, validateRequest(checkPaymentSchema), checkPaymentDonation)
route.post('/abacate-pay-webhook', validateRequest(webhookSchema), handleAbacatePayWebhook)

export default route
