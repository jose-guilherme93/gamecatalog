import * as z from 'zod'
import logger from '@/scripts/logger.js'
import jwt from 'jsonwebtoken'
import type { Response, Request } from 'express'
import { insertSession, searchUserByEmail } from '@/models/authModel.js'
import { pool } from '@/utils/connectDatabase.js'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'

const userSchema = z.object({
  email: z.email('formato de email inválido').max(100),
  password_hash: z.string().min(8).max(64),
})

export const loginController = async (req: Request, res: Response) => {
  const { email, password_hash } = req.body
  const ip = req.get('x-forwarded-for') || req.socket.remoteAddress
  const browser = req.headers['user-agent']

  const parsed = userSchema.safeParse({ email, password_hash })
  logger.info(`Tentativa de login: ${email}`)

  try {
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Formato de email ou senha inválido',
        errors: parsed.error.issues,
      })
    }

    const user = await searchUserByEmail(parsed.data.email)
    
    if (!user) {
      logger.warn(`Falha de login para: ${email}`)
      return res.status(401).json({ message: 'Email ou senha incorretos' })
    }

    if (!user.password_hash) {
      logger.warn(`Falha de login para: ${email}`)
      return res.status(401).json({ message: 'Email ou senha incorretos' })
    }

    const isPasswordValid = await bcrypt.compare(password_hash, String(user.password_hash))
    
    if (!isPasswordValid) {
      logger.warn(`Falha de login para: ${email}`)
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
    // 2. Gerenciar sessões simultâneas (Max 5)
    const searchActiveSessions = await pool.query(
      'SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at ASC',
      [user.id],
    )

    if (searchActiveSessions.rowCount! >= 5) {
      const oldestSessionId = searchActiveSessions.rows[0].id
      await pool.query('DELETE FROM sessions WHERE id = $1', [oldestSessionId])
      logger.info(`Sessão antiga removida para o usuário ${user.id}`)
    }

    // 3. Inserir nova sessão no banco
    await insertSession({
      sessionId,
      userId: user.id,
      browser: browser || 'Unknown',
      ip: ip || 'Unknown',
      expiresAt,
    })

    logger.info(`Login bem-sucedido: ${email}`)

    // 4. Retorno COMPLETO para o frontend (Token + Dados do Usuário)
    return res.status(200).json({
      message: 'Login realizado com sucesso',
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || null,
        role: user.role || 'user',
      },
    })

  } catch (error) {
    logger.error(`Erro crítico no loginController: ${error}`)
    return res.status(500).json({ message: 'Erro interno no servidor' })
  }
}