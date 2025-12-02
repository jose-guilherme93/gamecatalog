import express, { Router } from 'express'

import { createDonationPayment, checkPaymentDonation, handleAbacatePayWebhook } from '@/controllers/paymentController.js'
const route: Router = express.Router()

route.post('/', createDonationPayment)
route.post('/payment-check', checkPaymentDonation)
route.post('/abacate-pay-webhook/', handleAbacatePayWebhook)
export default route
