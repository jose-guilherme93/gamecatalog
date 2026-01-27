import logger from '@/scripts/logger.js'
import type { Response, Request, NextFunction } from 'express'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import {
  checkUser,
  createUserDB,
  deleteUserDB,
  getAllUsersDB,
  getSessionByIdDb,
  getUserByID,
  updateUserDB
} from '../models/userModel.js'

export const userParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido.'),
  }),
})

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(100),
    email: z.string().email('Formato de email inválido').max(100),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(64),
    avatar: z.string().url('URL do avatar inválido').optional().nullable(),
  }),
})

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido.'),
  }),
  body: z.object({
    username: z.string().min(3).max(100).optional(),
    email: z.email().max(100).optional(),
    password: z.string().min(6).max(64).optional(),
    avatar: z.string().url().optional().nullable(),
  }),
})

// Helper to remove sensitive fields
const sanitizeUser = (user: any) => {
  const { password_hash, ...rest } = user
  return rest
}

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getAllUsersDB()
    const users = result.rows.map(sanitizeUser)
    return res.status(200).json({ users })
  } catch (error) {
    next(error)
  }
}

export const createUserController = async (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password, avatar } = req.body

  try {
    logger.info(`Criando usuário: ${username}`)

    const check = await checkUser({ email })
    if (check.rows.length > 0) {
      return res.status(409).json({ message: 'E-mail já cadastrado' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      id: randomUUID(),
      username,
      email,
      password_hash: hashedPassword,
      avatar: avatar || null,
    }

    const result = await createUserDB(newUser)
    logger.info(`Usuário criado com ID: ${result.rows[0].id}`)

    return res.status(201).json({ user: sanitizeUser(result.rows[0]) })
  } catch (error) {
    next(error)
  }
}

export const deleteUserController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  try {
    logger.warn(`Deletando usuário: ${id}`)
    const result = await deleteUserDB(id as string)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    return res.status(200).json({
      message: 'Usuário removido com sucesso',
      deletedAt: result.rows[0].deleted_at
    })
  } catch (error) {
    next(error)
  }
}

export const updateUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const updateData = { ...req.body }

  try {
    if (updateData.password) {
      updateData.password_hash = await bcrypt.hash(updateData.password, 10)
      delete updateData.password
    }

    const result = await updateUserDB(id as string, updateData)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    return res.status(200).json({ user: sanitizeUser(result.rows[0]) })
  } catch (error) {
    next(error)
  }
}

export const getUserByIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  try {
    const result = await getUserByID(id as string)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    return res.status(200).json({ user: sanitizeUser(result.rows[0]) })
  } catch (error) {
    next(error)
  }
}

export const getSessionByIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  try {
    logger.info(`Buscando sessões para o usuário: ${id}`)
    const result = await getSessionByIdDb(id as string)

    return res.status(200).json({ sessions: result.rows })
  } catch (error) {
    next(error)
  }
}
