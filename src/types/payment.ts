import z from 'zod'

export const donationSchema = z.object({
  id: z.uuidv4(),
  platformFee: z.number(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'EXPIRED']),
  externalId: z.string().default('default-id'),
  amount: z.number().int().positive().min(100),
  expiresIn: z.number().int().positive().optional(),
  description: z.string().default('doação para o projeto'),
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

export type DonationPayload = z.infer<typeof donationSchema>

export type DonationBody = z.infer<typeof BodySchema>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BodySchema = donationSchema.omit({
  id: true,
  platformFee: true,
  status: true,
})

export const abacateCreateResponseSchema = z.object({
  data: z.object({
    id: z.string(),
    pixCode: z.string().optional(),
    pixQrCode: z.object({
      id: z.string().optional(),
      customer: z.object({
        id: z.string().optional(),
        metadata: z.object({
          name: z.string().optional(),
          cellphone: z.string().optional(),
          taxId: z.string().optional(),
          email: z.string().optional(),
          zipCode: z.string().optional(),
        }).optional(),
      }).optional(),
      amount: z.number().optional(),
      kind: z.string().optional(),
      status: z.string().optional(),
      metadata: z.object({ externalId: z.string().optional() }).optional(),
    }).optional(),
    payment: z.object({
      amount: z.number().optional(),
      fee: z.number().optional(),
      method: z.string().optional(),
    }).optional(),
  }).optional(),
})

export type AbacateCreateResponse = z.infer<typeof abacateCreateResponseSchema>
