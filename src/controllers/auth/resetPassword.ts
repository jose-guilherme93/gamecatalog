import logger from '../../scripts/logger.js'
import { pool } from '../../utils/connectDatabase.js'
import * as z from 'zod'
import type { Request, Response } from 'express'

const tokenSchema = z.object({
  recoveryToken: z.string().length(64).regex(/^[a-f0-9]{64}$/i),
})
export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { recoveryToken } = tokenSchema.parse(req.query)

    const { newPasswordHash: password } = req.body
    if(!password || password.length < 6) {
      return res.status(400).json({ message: 'password needs at least 6 digits' })
    }

    const responseDb = await pool.query(`
      SELECT * 
      FROM recovery 
      WHERE code = $1`, [recoveryToken])

    if(responseDb.rows.length === 0 || responseDb.rowCount === 0) {
      return res.status(401).json({ message: 'código de verificação inválido' })
    } else {
      const responseDbRecoveryPassword =
      await pool.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE id = $2 RETURNING *`, [password, responseDb.rows[0].user_id])

      return res.status(200).json({ message: responseDbRecoveryPassword.rows[0] })
    }
  } catch(error) {
    if (error instanceof z.ZodError) {
      logger.warn('Validation error during password reset', { error: error.issues })
      return res.status(400).json({ message: 'Invalid token format', details: error.issues })
    }
    logger.error('Error during password reset', { error })
    return res.status(500).json({ error: 'Internal server error' })
  }
}
