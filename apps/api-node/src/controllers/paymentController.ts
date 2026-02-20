import { type Response, type Request, type NextFunction } from 'express'
import { z } from 'zod'
import logger from '@/scripts/logger.js'
import { rdb } from '@/utils/redis.js'
import { createDonationPaymentDB, updateDonationPaymentDB, getDonationByExternalId } from '@/models/paymentModel.js'
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
      expiresIn: 223,
      userId: (req.user as any)?.userId,
      pixPayload: abacate.data,
    }

    await rdb.lPush('pix:donations:queue', JSON.stringify(donationData))
    console.log(rdb)
    const queryDB: QueryResult = await createDonationPaymentDB(donationData as any)

    if (queryDB.rowCount! > 0) {
      logger.info(`Doação criada com sucesso: ${donationData.id}`)
      return res.status(201).json({
        message: 'Doação iniciada com sucesso',
        data: abacate.data,
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
    const donation = await getDonationByExternalId(id)

    if (!donation) {
      return res.status(404).json({ message: 'Doação não encontrada' })
    }

    const userId = (req.user as any)?.userId
    if (donation.user_id && donation.user_id !== userId) {
      logger.warn(`Tentativa de acesso não autorizado à doação ${id} pelo usuário ${userId}`)
      return res.status(403).json({ message: 'Acesso negado' })
    }


    if (donation.status !== 'PENDING') {
      return res.status(200).json({
        data: {
          id: donation.external_id,
          status: donation.status,
          amount: donation.amount,
          pixCode: donation.pix_payload?.brCode || donation.pix_payload?.pixCode,
          brCode: donation.pix_payload?.brCode,
          brCodeBase64: donation.pix_payload?.brCodeBase64,
        },
      })
    }


    const cooldownKey = `pix:check:cooldown:${id}`
    const onCooldown = await rdb.get(cooldownKey)

    if (onCooldown) {
      return res.status(200).json({
        data: {
          id: donation.external_id,
          status: donation.status,
          amount: donation.amount,
          pixCode: donation.pix_payload?.brCode || donation.pix_payload?.pixCode,
          brCode: donation.pix_payload?.brCode,
          brCodeBase64: donation.pix_payload?.brCodeBase64,
        },
      })
    }


    const url = `https://api.abacatepay.com/v1/pixQrCode/check?id=${id}`
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error(`Erro ao consultar API externa: ${response.statusText}`)
    }

    const abacateJson = (await response.json()) as any
    const abacateStatus = abacateJson.data?.status

    if (abacateStatus && abacateStatus !== donation.status) {
      await updateDonationPaymentDB(
        id,
        null,
        abacateJson.data?.id,
        abacateStatus,
        abacateJson.data?.payment?.fee,
        abacateJson.data,
        null,
        null
      )
    }

    await rdb.setEx(cooldownKey, 30, 'true')

    return res.status(200).json({
      data: {
        id: id,
        status: abacateStatus || donation.status,
        amount: abacateJson.data?.amount || donation.amount,
        pixCode: abacateJson.data?.brCode || abacateJson.data?.pixCode,
        brCode: abacateJson.data?.brCode,
        brCodeBase64: abacateJson.data?.brCodeBase64,
      },
    })
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
    const pixPayload = payload || null
    const rawCustomer = pixQrCode?.customer ?? payload?.customer ?? null
    const customerData = (rawCustomer && typeof rawCustomer === 'object' && 'metadata' in rawCustomer)
      ? {
        name: rawCustomer.metadata?.name,
        email: rawCustomer.metadata?.email,
        cellphone: rawCustomer.metadata?.cellphone,
        taxId: rawCustomer.metadata?.taxId
      }
      : rawCustomer
    const abacatepayCustomerId = (rawCustomer && typeof rawCustomer === 'object') ? rawCustomer.id : null

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

      // Notify worker about important status changes
      const oldStatus = result.rows[0]?.old_status
      if (['PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED'].includes(status) && oldStatus !== status) {
        const message = {
          externalId: abacateId,
          status,
          customer: result.rows[0]?.customer_data,
          amount: pixQrCode?.amount || payload?.amount,
          id: result.rows[0]?.id || metadataExternalId
        }
        await rdb.lPush('pix:donations:queue', JSON.stringify(message))
        logger.info(`Notificação de status ${status} enviada para a fila para ${abacateId} (Transição: ${oldStatus} -> ${status})`)
      }
    } else {
      logger.warn(`Doação não encontrada para atualizar via webhook: ${abacateId}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    next(error)
  }
}
