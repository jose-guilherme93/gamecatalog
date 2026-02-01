import { DonationPayload } from '@/types/payment.js'
import { pool } from '@/utils/connectDatabase.js'

export async function createDonationPaymentDB(data: DonationPayload) {
  const query = await pool.query(`INSERT INTO donations 
        (id, external_id, amount, platform_fee, customer_data, description, status, user_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *`, [data.id, data.externalId, data.amount, data.platformFee, data.customer, data.description, 'PENDING', data.userId])
  return query
}

export async function updateDonationPaymentDB(
  abacateId: string | null,
  metadataExternalId: string | null,
  pixId: string | null,
  status: string | null,
  platformFee: number | null,
  pixPayload: unknown | null,
  customerData: unknown | null,
  abacatepayCustomerId: string | null,
) {
  const query = await pool.query(
    `UPDATE donations SET
        status = COALESCE($1, status),
        pix_id = COALESCE($2, pix_id),
        platform_fee = COALESCE($3, platform_fee),
        pix_payload = COALESCE($4, pix_payload),
        customer_data = COALESCE($5, customer_data),
        abacatepay_customer_id = COALESCE($6, abacatepay_customer_id),
        updated_at = NOW()
      WHERE external_id = $7 OR external_id = $8
      RETURNING *`,
    [status, pixId, platformFee, pixPayload, customerData, abacatepayCustomerId, abacateId, metadataExternalId],
  )

  return query
}

export async function getDonationByExternalId(externalId: string) {
  const query = await pool.query(
    'SELECT * FROM donations WHERE external_id = $1',
    [externalId]
  )
  return query.rows[0]
}
