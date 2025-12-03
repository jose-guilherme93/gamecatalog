import { DonationPayload } from '@/types/payment.js'
import { pool } from '@/utils/connectDatabase.js'

export async function  createDonationPaymentDB(data: DonationPayload) {
  const query = await pool.query(`INSERT INTO donations 
        (id, external_id, amount, platform_fee, customer_data, description, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`, [data.id, data.metadata!.externalId, data.amount, data.platformFee, data.customer, data.description, 'PENDING'])
  return query
}
