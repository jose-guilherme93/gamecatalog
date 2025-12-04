import type { Review } from '@/types/review.js'
import { pool } from '../utils/connectDatabase.js'
import logger from '@/scripts/logger.js'

interface ReviewParams {
  user_id: string
  game_id: string
  score?: number
  review_text?: string
}

export async function checkExistingReview(user_id: string, game_id: string) {
  const query = `
    SELECT * FROM reviews
    WHERE user_id = $1 AND game_id = $2;
  `
  try {
    const response = await pool.query(query, [user_id, game_id])
    return response
  } catch (error) {
    logger.error('Erro ao verificar review existente:', error)
    throw error
  }
}

export async function createReviewDB(params: ReviewParams): Promise<Review> {
  const query = `
    INSERT INTO reviews (user_id, game_id, score, review_text)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `

  const { user_id, game_id, score, review_text } = params

  try {
    const response = await pool.query(query, [user_id, game_id, score, review_text])
    return response.rows[0]
  } catch (error) {
    logger.error('Erro ao criar review DB:', error)
    throw error
  }
}

export async function getReviewByIdDB(parsedReviewGameId: string): Promise<Review | null> {
  const query = `
    SELECT * FROM reviews
    WHERE game_id = $1;
  `
  try {
    const response = await pool.query(query, [parsedReviewGameId])
    return response.rows[0] || null
  } catch (error) {
    logger.error('Erro ao buscar review por ID:', error)
    throw error
  }
}

export async function deleteReviewDB(params: { game_id: string; user_id: string }) {
  const query = `
    DELETE FROM reviews
    WHERE user_id = $1 AND game_id = $2;
  `
  try {
    const response = await pool.query(query, [params.user_id, params.game_id])
    if(response.rowCount === 0) {
      logger.warn('Nenhum review encontrado para deletar com os parâmetros fornecidos.')
    }
    return response
  } catch (error) {
    logger.error('Erro ao deletar review DB:', error)
    throw error
  }
}

export async function updateReviewDB(params: ReviewParams): Promise<Review | null> {
  logger.info(`atualizando review no model: ${params}`)

  const keysToUpdate = Object.keys(params)
  const valeusToUpdate = Object.values(params)
  const setString = keysToUpdate
    .map((key, index) => `${key} = $${index + 1}`)
    .join(', ')

  const query = `
    UPDATE reviews
    SET ${setString}
    WHERE user_id = $${valeusToUpdate.length + 1} AND game_id = $${valeusToUpdate.length + 2}
    RETURNING *;
    `
  try {
    const response = await pool.query(query, [...valeusToUpdate, params.user_id!, params.game_id!])
    return response.rows[0] || null
  } catch (error) {
    logger.error('Erro ao atualizar review DB:', error)
    throw error
  }
}
