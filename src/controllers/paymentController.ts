import type { Response, Request } from 'express'
import AbacatePay from 'abacatepay-nodejs-sdk'
import { logger } from '@/scripts/logger.js'

export async function createDonationPayment(req: Request, res: Response) {
  const { quantity, price } = req.body
  const name = 'Donation'
  logger.info('creating donation pix...')
  const abacate = AbacatePay.default(process.env.ABACATE_PAY_API!)
  const billing = await abacate.billing.create({
    frequency: 'ONE_TIME',
    methods: ['PIX'],
    products: [
      {
        externalId: 'Donation plan',
        name,
        quantity,
        price, // Amount in cents
      },
    ],
    returnUrl: 'https://localhost:3000',
    completionUrl: 'https://yoursite.com/payment/success',
    customer: {
      name: 'Customer Name',
      email: 'customer@example.com',
      cellphone: '+5511999999999',
      taxId: '09240529020',
    },
  })
  res.status(200).json({ message: 'ok',
    data: billing.data,
  })
}
