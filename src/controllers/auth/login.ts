import * as z from 'zod'
import { logger } from '@/scripts/logger.js'
import jwt from 'jsonwebtoken'
import type { Response, Request } from 'express'
import { insertSession, searchUserByEmail } from '@/models/authModel.js'
import { pool } from '@/utils/connectDatabase.js'

const userSchema = z.object({
  email: z
    .email('formato de email inválido')
    .min(1)
    .max(100),
  password_hash:
    z.string()
      .min(8, 'a senha deve conter ao menos 8 caracteres')
      .max(64, 'a senha deve conter no máximo 64 caracteres'),
})

export const loginController = async (req: Request, res: Response) => {

  const { email, password_hash } = req.body
  const ip = req.get('x-forwarded-for') || req.socket.remoteAddress
  const browser = req.headers['user-agent']

  const parsed = userSchema.safeParse({ email, password_hash })
  logger.info(`try to login with ${email} email`)

  try {
    if (!parsed.success) {
      logger.warn('Invalid input for login', parsed.error.issues)
      return res.status(400).json({ message: 'Invalid email or password format', errors: parsed.error.message })
    }

    const responseDBSearch = await searchUserByEmail(parsed.data.email)
    if (!responseDBSearch || password_hash !== responseDBSearch.password_hash) {
      logger.warn('invalid email or password')
      return res.status(404).json({ message: 'invalid email or password' })
    }

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const sessionParameters = {
      sessionId: crypto.randomUUID(),
      userId: responseDBSearch.id,
      browser: browser || 'Unknown',
      ip: ip || 'Unknown',
      expiresAt,

    }
    const sessionToken = jwt.sign({
      sub: sessionParameters.sessionId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,

    }, process.env.JWT_SECRET!)

    const searchActiveSessions = await pool.query('SELECT user_id FROM sessions WHERE user_id = $1', [responseDBSearch.id])
    const MAX_SESSIONS = 5
    if(searchActiveSessions.rowCount! >= MAX_SESSIONS) {
      const oldestSessionQuery = `
      SELECT id FROM sessions
      WHERE user_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `
      const oldestSessionResult = await pool.query(oldestSessionQuery, [responseDBSearch.id])

      if (oldestSessionResult.rowCount! > 0) {
        const oldestSessionId = oldestSessionResult.rows[0].id
        await pool.query('DELETE FROM sessions WHERE id = $1', [oldestSessionId])
        logger.info(`Sessão mais antiga removida: ${oldestSessionId}`)
      }
    }
    logger.info(`${searchActiveSessions.rowCount}`)
    const newSession = await insertSession(sessionParameters)
    logger.info(`token inserted successfully in: ${newSession.rows[0].created_at}`)
    logger.info(`login success with: ${email}`)
    return res.status(200).json({
      message: 'Login realizado com sucesso',
      sessionToken,

    })
  } catch (error) {
    logger.error(`error ao logar: ${error}`)

    res.status(500).json({ message: 'Erro interno no servidor' })
    throw error
  }

}
