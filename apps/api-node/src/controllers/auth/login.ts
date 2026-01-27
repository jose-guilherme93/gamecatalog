import { z } from 'zod'
import logger from '@/scripts/logger.js'
import jwt from 'jsonwebtoken'
import type { Response, Request, NextFunction } from 'express'
import { insertSession, searchUserByEmail } from '@/models/authModel.js'
import { pool } from '@/utils/connectDatabase.js'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Formato de email inválido').max(100),
    password: z.string().min(1, 'Senha é obrigatória').max(64),
  }),
})

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  const ip = req.get('x-forwarded-for') || req.socket.remoteAddress
  const browser = req.headers['user-agent']

  try {
    logger.info(`Tentativa de login: ${email}`)

    const user = await searchUserByEmail(email)

    if (!user || !user.password_hash) {
      logger.warn(`Falha de login para: ${email} - Usuário não encontrado ou sem senha`)
      return res.status(401).json({ message: 'Email ou senha incorretos' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash as string)

    if (!isPasswordValid) {
      logger.warn(`Falha de login para: ${email} - Senha inválida`)
      return res.status(401).json({ message: 'Email ou senha incorretos' })
    }

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 dias
    const sessionId = crypto.randomUUID()

    const sessionToken = jwt.sign(
      {
        sub: sessionId,
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' },
    )

    // Gerenciar sessões simultâneas (Max 5)
    const { rows: activeSessions } = await pool.query(
      'SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at ASC',
      [user.id],
    )

    if (activeSessions.length >= 5) {
      const oldestSessionId = activeSessions[0].id
      await pool.query('DELETE FROM sessions WHERE id = $1', [oldestSessionId])
      logger.info(`Sessão antiga removida para o usuário ${user.id}`)
    }

    // Inserir nova sessão no banco
    await insertSession({
      sessionId,
      userId: user.id,
      browser: browser || 'Unknown',
      ip: ip || 'Unknown',
      expiresAt,
    })

    logger.info(`Login bem-sucedido: ${email}`)

    return res.status(200).json({
      message: 'Login realizado com sucesso',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    next(error)
  }
}