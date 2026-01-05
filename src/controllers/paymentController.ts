import { type Response, type Request } from 'express'
import { z } from 'zod'

import logger from '@/scripts/logger.js'

import { createDonationPaymentDB, updateDonationPaymentDB } from '@/models/paymentModel.js'

import { DonationBody, DonationPayload, donationSchema } from '@/types/payment.js'
import { QueryResult } from 'pg'

const token = process.env.ABACATE_PAY_API

export async function createDonationPayment(req: Request, res: Response) {
  logger.info('Iniciando criação de doação PIX...')

  const bodySchema = donationSchema.omit({
    id: true,
    platformFee: true,
    status: true,
  })

  const parsedBody = bodySchema.safeParse(req.body)
  if (!parsedBody.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsedBody.error })
  }

  try {

    const abacateResponse = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ABACATE_PAY_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedBody.data),
    })

    if (!abacateResponse.ok) {
      throw new Error(`AbacatePay Error: ${abacateResponse.statusText}`)
    }

    const abacateData: DonationPayload = await abacateResponse.json()
    console.log(abacateData)
    const donationData = {
      id: crypto.randomUUID(),
      externalId: abacateData.data.id,
      amount: parsedBody.data.amount,
      customer: parsedBody.data.customer,
      description: parsedBody.data.description,
      platformFee: 80,
      status: 'PENDING',
      metadata: parsedBody.data.metadata,
      expiresIn: 123,
    }

    const queryDB: QueryResult = await createDonationPaymentDB(donationData)

    if (queryDB.rowCount! > 0) {
      logger.info(`Doação criada com sucesso: ${donationData.id}`)
      return res.status(201).json({
        message: 'Donation created',
        id: abacateData.data.id,
        pixCode: abacateData.data.pixCode, // Exemplo de retorno útil
      })
    }

    return res.status(500).json({ message: 'Failed to save donation' })

  } catch (error: unknown) {
    if (error instanceof Error) {

      logger.error(`Erro no fluxo de doação: ${error.message}`)
    }
    return res.status(500).json({ message: 'Internal server error' })
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

  logger.info(`parameter: ${webhookSecret}`)
  const event = req.body
  const payload = (event && event.data) ? event.data : event
  logger.info(`Received webhook: ${JSON.stringify(payload)}`)

  try {
    const pixQrCode = payload?.pixQrCode ?? payload?.pix_qr_code ?? null
    const payment = payload?.payment ?? null

    const abacateId = pixQrCode?.id ?? payload?.id ?? null
    const metadataExternalId = pixQrCode?.metadata?.externalId ?? payload?.metadata?.externalId ?? null
    const pixId = pixQrCode?.id ?? null
    const status = pixQrCode?.status ?? null
    const platformFee = payment?.fee ?? null
    const pixPayload = payload ? JSON.stringify(payload) : null
    const customerData = pixQrCode?.customer ?? payload?.customer ?? null
    const abacatepayCustomerId = pixQrCode?.customer?.id ?? null

    const result = await updateDonationPaymentDB(
      abacateId,
      metadataExternalId,
      pixId,
      status,
      platformFee,
      pixPayload,
      customerData,
      abacatepayCustomerId,
    )

    if (result && result.rowCount && result.rowCount > 0) {
      logger.info(`Donation updated: rows=${result.rowCount}`)
    } else {
      logger.info('Donation not found to update')
    }

    return res.status(200).json({ received: true })
  } catch (error: unknown) {
    if (error instanceof Error) logger.error(`Webhook handling error: ${error.message}`)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
