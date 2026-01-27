import { z } from 'zod'
import logger from '../../scripts/logger.js'
import { pool } from '../../utils/connectDatabase.js'
import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'

export const resetPasswordSchema = z.object({
  query: z.object({
    recoveryToken: z.string().length(64, 'Token de recuperação inválido'),
  }),
  body: z.object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').max(64),
  }),
})

export const resetPasswordController = async (req: Request, res: Response, next: NextFunction) => {
  const { recoveryToken } = req.query as { recoveryToken: string }
  const { password } = req.body

  try {
    logger.info('Tentativa de redefinição de senha')

    const { rows: recoveryRows } = await pool.query(
      'SELECT user_id FROM recovery WHERE code = $1',
      [recoveryToken]
    )

    if (recoveryRows.length === 0) {
      logger.warn(`Token de recuperação inválido ou expirado: ${recoveryToken}`)
      return res.status(401).json({ message: 'Código de verificação inválido ou expirado' })
    }

    const userId = recoveryRows[0].user_id
    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    )

    await pool.query('DELETE FROM recovery WHERE code = $1', [recoveryToken])

    logger.info(`Senha redefinida com sucesso para o usuário: ${userId}`)

    return res.status(200).json({ message: 'Senha redefinida com sucesso' })
  } catch (error) {
    next(error)
  }
}
