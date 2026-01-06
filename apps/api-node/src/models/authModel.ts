import { pool } from '../utils/connectDatabase.js'
import { generateBigIntId } from '../utils/generateBigInt.js'
import { type QueryResult } from 'pg'

interface User {
  id: bigint | string
  // Adicione outras propriedades do usuário aqui
  [key: string]: string | bigint
}

interface SessionParameters {
  sessionId: bigint | string
  userId: bigint | string
  browser: string
  ip: string
  expiresAt: Date
}

export const searchUserByEmail = async (email: string): Promise<User | undefined> => {
  const responseQuery: QueryResult<User> = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return responseQuery.rows[0]
}

export const searchEmailRegistered = async (email: string): Promise<QueryResult<User>> => {
  const query = 'SELECT * FROM users WHERE email = $1;'
  return await pool.query(query, [email])
}

export const insertRecoveryTokenInDB = async (fields: User, recoveryToken: string): Promise<object> => {
  try {
    const userId = fields.id
    const idRecovery = generateBigIntId()

    const query = `
      INSERT INTO recovery (
        id,
        user_id,
        code,
        expires_at,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, NOW(), NOW()
      )
      RETURNING *;
    `

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    const values = [idRecovery, userId, recoveryToken, expiresAt]

    const responseQuery: QueryResult = await pool.query(query, values)

    return responseQuery.rows[0]
  } catch (error) {
    console.error('❌ Erro ao inserir token:', error)
    throw error
  }
}

// LOGIN

export const insertSession = async (sessionParameters: SessionParameters): Promise<QueryResult> => {
  const { sessionId, userId, browser, ip, expiresAt } = sessionParameters
  try {
    const query = `
      INSERT INTO sessions (
        id,
        user_id,
        browser,
        ip,
        expires_at
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      RETURNING *;
    `

    const values = [sessionId, userId, browser, ip, expiresAt]

    return await pool.query(query, values)
  } catch (error) {
    console.error('❌ Erro ao inserir token de sessão:', error)
    throw error
  }
}
