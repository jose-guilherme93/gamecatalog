import logger from '@/scripts/logger.js'
import type { Response, Request } from 'express'
import { randomUUID } from 'node:crypto'
import * as z from 'zod'

import type { Session } from '@/types/session.js'
import type { QueryResult } from 'pg'
import type { User } from '@/types/user.js'
type SessionQueryResult = QueryResult<Session>

import {
  checkUser,
  createUserDB,
  deleteUserDB,
  getAllUsersDB,
  getSessionByIdDb,
  getUserByID,
  updateUserDB } from '../models/userModel.js'

const ParamsSchema = z.object({
  id: z.string('ID inválido.'),
})

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const getUsers = await getAllUsersDB()

    res.status(200).json({ users: getUsers.rows })

  } catch(error) {
    logger.info(error)
  }
}

const emailSchema = z.string().email('O formato do email é inválido. Verifique o endereço digitado.')

export const createUserController = async (req: Request, res: Response) => {

  const { username, email: rawEmail, password_hash, avatar }: User = req.body
  logger.info('creating a user...')

  try {
    const email = rawEmail?.toString().trim()
    const parsedEmail = emailSchema.parse(email)

    if(!username || !password_hash) {
      return res.status(400).json({ message: 'dados incompletos: username ou password_hash faltando' })
    }

    const newUser: User = {
      id: randomUUID(),
      username,
      email: parsedEmail,
      password_hash,
      avatar,
    }

    const check = await checkUser({ email: newUser.email })

    if(check.rows.length > 0) {
      return res.status(409).json({ message:'usuário já cadastrado' })
    }

    try {
      const result = await createUserDB(newUser)
      logger.info(`usuário criado com ID: ${result.rows[0].id}`)
      return res.status(201).json({ user: result.rows[0] })
    }
    catch (dbError) {
      logger.error('erro ao criar usuário no DB: ', dbError)
      return res.status(500).json({ message: 'erro ao criar usuário',
        error: dbError instanceof Error ? dbError.message : String(dbError),
      })
    }
  }

  catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`Zod Validation Failed: ${error.issues[0]!.message}`)
      return res.status(400).json({ message: error.issues[0]!.message })
    }

    logger.error('Erro no fluxo de criação:', error)
    return res.status(500).json({
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const deleteUserController = async (req: Request, res: Response) => {

  const { id } = ParamsSchema.parse(req.params)
  logger.warn(`deleting user with id: ${id}`)
  try {
    const deleteUser = await deleteUserDB(id)
    if(deleteUser.rows.length > 0) {
      logger.info(`deleted_at at ${deleteUser.rows[0].deleted_at}`)
      res.status(200).json({ user: deleteUser.rows[0] })

    }   else {res.status(404).json({ message: 'id not found' })

    }

  }   catch(error) {
    logger.error('erro na requisição: ', error)
    res.status(500).json({ message: error })
  }
}

export const updateUserByIdController = async (req: Request, res: Response) => {

  const { id } = ParamsSchema.parse(req.params)
  const updateUserFromUser = req.body
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace('T', ' ')

  updateUserFromUser['updated_at'] = timestamp

  try {

    const updatedUser = await updateUserDB(id, updateUserFromUser)
    if (updatedUser.rows.length > 0) {
      res.status(200).json({ user: updatedUser.rows[0] })
    } else {
      res.status(404).json({ message: 'NOT FOUND: usuário não encontrado' })
    }
  } catch (error) {
    if(error instanceof z.ZodError) {
      return res.status(400).json({ message: 'invalid data', errors: error.issues })
    }
    logger.error('erro ao atualizar usuário: ', error)
    res.status(500).json({ error: (error as Error).message })
  }
}

export const getUserByIdController = async (req: Request, res: Response) => {
  const { id } = ParamsSchema.parse(req.params)

  try {
    const getUser = await getUserByID(id)

    if(!getUser.rows.length) {
      return res.status(404).json({ message: 'NOT FOUND: usuário não encontrado' })
    } else {
      res.status(200).json({ user: getUser.rows[0] })
    }

  } catch(error) {
    logger.error('erro ao buscar usuário no banco: ', error)

    res.status(500).json({
      message: 'internal server error',
      error: (error as Error).message,
    })

  }
}

export const getSessionByIdController = async (req: Request, res: Response)  => {
  const { id } = ParamsSchema.parse(req.params)

  try {
    logger.info('searching sessions in DB')
    const result: SessionQueryResult = await getSessionByIdDb(id)
    if (result.rowCount! > 0) { logger.info('DB: consult ok') }
    else { logger.warn('DB: session not found') }

    res.status(200).json({ message:result.rows })

  } catch(error) {
    if(error instanceof z.ZodError) {
      logger.error('validation error: ', error)
      return res.status(400).json({ message: 'invalid data', errors: error.issues })
    }
    logger.error('erro ao buscar sessões no banco: ', error)

    res.status(400).json({
      error: (error as Error).message,
    })

  }
}
