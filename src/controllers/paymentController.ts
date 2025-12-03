import { type Response, type Request } from 'express'
import { z } from 'zod'

import { logger } from '@/scripts/logger.js'

import { createDonationPaymentDB } from '@/models/paymentModel.js'
import { QueryResult } from 'pg'
import { DonationBody, DonationPayload, donationSchema } from '@/types/payment.js'

const token = process.env.ABACATE_PAY_API

export async function createDonationPayment(req: Request, res: Response) {
  logger.info('creating pix donation...')

  const BodySchema = donationSchema.omit({
    id: true,
    platformFee: true,
    status: true,
  })
  const parsedBody = BodySchema.safeParse(req.body)
  if(!parsedBody.success) {
    return res.status(401).json({ message: 'dados inválidos' })
  }

  try {
    const options = {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.ABACATE_PAY_API}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(
        parsedBody.data,
      ),
    }

    fetch('https://api.abacatepay.com/v1/pixQrCode/create', options)
      .then(res => res.json())
      .then(res => logger.info(`abacatepay: ${ JSON.stringify(res)}`))
      .catch(err => console.error(err))

    const bodyPayload: DonationBody = {
      amount: parsedBody.data.amount,
      customer: parsedBody.data.customer,
      description: parsedBody.data.description,
      externalId: parsedBody.data.externalId,
      expiresIn: 123,
      metadata: parsedBody.data.metadata,
    }

    let queryDB: QueryResult | null = null

    const data: DonationPayload = {
      id: crypto.randomUUID(),
      platformFee: 80,
      status: 'PENDING',

      ...bodyPayload,
    }

    try {
      queryDB = await createDonationPaymentDB(data)
      if(queryDB.rowCount! > 0) {
        logger.info(`donation payment created id: ${JSON.stringify(queryDB.rows[0])}`)
        res.status(201).json({ message: 'donation payment created.', id:queryDB.rows[0].id  })
      } else {
        logger.error('error at creation of donation payment on DB: ')
      }
    } catch(error) {
      logger.error(`erro ao inserir no banco de dados: ${error}`)
      res.status(500).json({ message: 'internal error' })
    }
  } catch(err) { logger.error(err)}
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
  }
  catch (error) {
    logger.info(error)
  }
}

export async function handleAbacatePayWebhook( req: Request, res: Response ) {

  const webhookSecretSchema = z.string()
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
