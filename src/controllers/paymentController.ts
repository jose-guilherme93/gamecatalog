import { type Response, type Request } from 'express'
import { z } from 'zod'

import { logger } from '@/scripts/logger.js'

const donationSchema = z.object({
  amount: z.number().int().positive(),
  expiresIn: z.number().int().positive().optional(),
  description: z.string(),
  customer: z.object({
    name: z.string().min(3),
    cellphone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    email: z.email(),
    taxId: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/),
  }),
  metadata: z.object({
    externalId: z.string(),
  }).optional(),
})

const token = process.env.ABACATE_PAY_API

export async function createDonationPayment(req: Request, res: Response) {
  logger.info('creating pix donation...')

  const validation = donationSchema.safeParse(req.body)

  if (!validation.success) {
    logger.error('Validation error:', validation.error.issues)
    return res.status(400).json({
      message: 'Dados de requisição inválidos',
      errors: validation.error.issues,
    })
  }

  const bodyData = validation.data

  const url = 'https://api.abacatepay.com/v1/pixQrCode/create'

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()

    if (!response.ok) {
      logger.error('API AbacatePay Error:', data)
      return res.status(response.status).json({
        message: 'Erro ao criar pagamento na AbacatePay',
        data,
      })
    }

    logger.info(JSON.stringify(data))
    return res.status(200).json({
      message: 'Pagamento de doação Pix criado com sucesso',
      data,
    })
  } catch (error) {
    logger.error('Internal Server Error:', error)
    return res.status(500).json({
      message: 'Erro interno no servidor ao processar pagamento',
    })
  }
}

export async function checkPaymentDonation(req: Request, res: Response) {
  const { id } = req.body
  const url = `https://api.abacatepay.com/v1/pixQrCode/check?id=${id}`
  const options = {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    body: null,
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()
    logger.info(data)
    return res.status(200).json({ data })
  } catch (error) {
    logger.info(error)
  }
}

const webhookSecretSchema = z.string()

export async function handleAbacatePayWebhook( req: Request, res: Response ) {
  logger.info('trying to receive data from webhook...')

  const { webhookSecret } = req.query
  const secretParsed = webhookSecretSchema.safeParse(webhookSecret)

  if ( secretParsed.data !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid webhook secret',
      message: secretParsed.error?.message,
    })
  }

  logger.info(`parametro: ${webhookSecret}`)
  const event = req.body
  logger.info(`Received webhook:', ${JSON.stringify(event.data)}`)

  res.status(200).json({ received: true })

}
