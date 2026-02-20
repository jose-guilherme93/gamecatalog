import { DonationPayload } from '@/types/payment.js'
import { pool } from '@/utils/connectDatabase.js'

export async function createDonationPaymentDB(data: DonationPayload) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const donationQuery = await client.query(
      `INSERT INTO donations 
        (id, external_id, amount, platform_fee, customer_data, description, status, user_id, pix_payload) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *`,
      [
        data.id,
        data.externalId,
        data.amount,
        data.platformFee,
        data.customer,
        data.description,
        'PENDING',
        data.userId,
        data.pixPayload,
      ],
    )

    await client.query(
      `INSERT INTO donation_status_history (donation_id, status, payload)
       VALUES ($1, $2, $3)`,
      [data.id, 'PENDING', JSON.stringify({ message: 'Donation initiated' })],
    )

    await client.query('COMMIT')
    return donationQuery
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
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
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const updateQuery = await client.query(
      `UPDATE donations d SET
        status = COALESCE($1, d.status),
        pix_id = COALESCE($2, d.pix_id),
        platform_fee = COALESCE($3, d.platform_fee),
        pix_payload = COALESCE($4, d.pix_payload),
        customer_data = COALESCE($5, d.customer_data),
        abacatepay_customer_id = COALESCE($6, d.abacatepay_customer_id),
        updated_at = NOW()
      FROM (SELECT id, status FROM donations WHERE external_id = $7 OR external_id = $8 FOR UPDATE) old
      WHERE d.id = old.id
      RETURNING d.*, old.status as old_status`,
      [
        status,
        pixId,
        platformFee,
        pixPayload,
        customerData,
        abacatepayCustomerId,
        abacateId,
        metadataExternalId,
      ],
    )

    if (updateQuery.rowCount! > 0 && status) {
      const donation = updateQuery.rows[0]
      const oldStatus = donation.old_status

      if (oldStatus !== status) {
        await client.query(
          `INSERT INTO donation_status_history (donation_id, status, payload)
           VALUES ($1, $2, $3)`,
          [donation.id, status, typeof pixPayload === 'string' ? pixPayload : JSON.stringify(pixPayload)],
        )
      }
    }

    await client.query('COMMIT')
    return updateQuery
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getDonationByExternalId(externalId: string) {
  const query = await pool.query('SELECT * FROM donations WHERE external_id = $1', [externalId])
  return query.rows[0]
}
