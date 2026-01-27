import { type Response, type Request, type NextFunction } from 'express'
import { z } from 'zod'
import logger from '@/scripts/logger.js'
import { rdb } from '@/utils/redis.js'
import { createDonationPaymentDB, updateDonationPaymentDB } from '@/models/paymentModel.js'
import { donationSchema, abacateCreateResponseSchema, type AbacateCreateResponse } from '@/types/payment.js'
import type { QueryResult } from 'pg'
import crypto from 'node:crypto'

export const createDonationSchema = z.object({
  body: donationSchema.omit({
    id: true,
    platformFee: true,
    status: true,
  }),
})

export const checkPaymentSchema = z.object({
  body: z.object({
    id: z.string().min(1),
  }),
})

export const webhookSchema = z.object({
  query: z.object({
    webhookSecret: z.string(),
  }),
})

export async function createDonationPayment(req: Request, res: Response, next: NextFunction) {
  try {
    logger.info('Iniciando criação de doação PIX...')

    const response = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ABACATE_PAY_API}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('Erro na API do AbacatePay:', errorData)
      return res.status(response.status).json({
        message: 'Erro ao criar cobrança no provedor de pagamento',
        details: errorData
      })
    }

    const abacateJson = await response.json()
    const abacateParse = abacateCreateResponseSchema.safeParse(abacateJson)
    const abacate: AbacateCreateResponse = abacateParse.success
      ? abacateParse.data
      : { data: { id: req.body.metadata?.externalId ?? 'default-id' } as any }

    const donationData = {
      id: crypto.randomUUID(),
      externalId: abacate.data!.id,
      amount: req.body.amount,
      customer: req.body.customer,
      description: req.body.description,
      platformFee: 80, // Default fee
      status: 'PENDING' as const,
      metadata: req.body.metadata,
      expiresIn: 123,
    }

    await rdb.lPush('pix:donations:queue', JSON.stringify(donationData))
    const queryDB: QueryResult = await createDonationPaymentDB(donationData as any)

    if (queryDB.rowCount! > 0) {
      logger.info(`Doação criada com sucesso: ${donationData.id}`)
      return res.status(201).json({
        message: 'Doação iniciada com sucesso',
        id: abacate.data!.id,
        pixCode: abacate.data!.pixCode,
      })
    }

    throw new Error('Falha ao salvar doação no banco de dados')
  } catch (error) {
    next(error)
  }
}

export async function checkPaymentDonation(req: Request, res: Response, next: NextFunction) {
  const { id } = req.body
  const token = process.env.ABACATE_PAY_API

  try {
    const url = `https://api.abacatepay.com/v1/pixQrCode/check?id=${id}`
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    return res.status(200).json({ data })
  } catch (error) {
    next(error)
  }
}

export async function handleAbacatePayWebhook(req: Request, res: Response, next: NextFunction) {
  const { webhookSecret } = req.query as { webhookSecret: string }

  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    logger.warn(`Tentativa de webhook com secret inválido: ${webhookSecret}`)
    return res.status(401).json({ error: 'Invalid webhook secret' })
  }

  try {
    const event = req.body
    const payload = (event && event.data) ? event.data : event
    logger.info(`Recebido webhook: ${JSON.stringify(payload)}`)

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
      logger.info(`Doação atualizada via webhook: ${abacateId}`)
    } else {
      logger.warn(`Doação não encontrada para atualizar via webhook: ${abacateId}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    next(error)
  }
}
