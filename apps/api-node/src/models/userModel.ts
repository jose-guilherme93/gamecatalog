import type { User } from '@/types/user.js'
import { pool } from '@/utils/connectDatabase.js'
import { z } from 'zod'

const checkUserSchema = z.object({
  email: z.email('Email inválido.'),
})

type checkUserType = z.infer<typeof checkUserSchema>

export const checkUser = async (userEmail: checkUserType) => {

  const parsed = checkUserSchema.parse(userEmail)
  const ifUserExistsQuery = 'SELECT * FROM USERS WHERE email = $1'
  const checkResult = await pool.query(ifUserExistsQuery, [parsed.email]) // Usa parsed.email
  return checkResult
}

export const createUserDB = async (newUser: User) => {

  const {
    id,
    username,
    email,
    password_hash,
    avatar,

  } = newUser

  const query = `INSERT INTO users (id, username, email, password_hash, avatar)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
    `
  const result = await pool.query(query, [id, username, email, password_hash, avatar])
  return result
}

export const deleteUserDB = async (id: string) => {
  const query = 'UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING deleted_at;'
  const responseQuery = await pool.query(query, [id])

  return responseQuery
}

interface UpdateUserData {
  [key: string]: string
}

export const updateUserDB = async (id: string, userData: UpdateUserData) => {
  const keys = Object.keys(userData)
  const values = Object.values(userData)
  const setString = keys
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ')

  const query = `UPDATE users SET ${setString} WHERE id = $${keys.length + 1}  RETURNING *;
  `
  const params = [...values, id]
  const responseQuery = await pool.query(query, params)

  return responseQuery
}

export const getUserByID = async (id: string) => {
  const query = 'SELECT * from users WHERE id = $1;'
  const responseQuery = await pool.query(query, [id])

  return responseQuery
}

export const getAllUsersDB = async () => {
  const query = 'SELECT * FROM users ORDER BY id ASC LIMIT 50 OFFSET 0;'
  const responseQuery = pool.query(query)

  return responseQuery
}

export const getSessionByIdDb = async (id: string) => {

  const query = 'SELECT * FROM sessions WHERE user_id = $1'
  const responseQuery = await pool.query(query, [id])
  return responseQuery

}
