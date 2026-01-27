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

const route: Router = express.Router()

route.post('/', validateRequest(createDonationSchema), createDonationPayment)
route.post('/payment-check', validateRequest(checkPaymentSchema), checkPaymentDonation)
route.post('/abacate-pay-webhook', validateRequest(webhookSchema), handleAbacatePayWebhook)

export default route
