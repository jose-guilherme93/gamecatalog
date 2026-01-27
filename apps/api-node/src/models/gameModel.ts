import { pool } from '../utils/connectDatabase.js'
import { type QueryResult } from 'pg'

interface Game {
  id: string
  title: string
  rating: number
  status: string
  review: string
  plataform: string
  first_release_date: Date
  storyline: string
  cover_url: string
  slug: string
  created_at?: Date
  updated_at?: Date
}

interface GameFilters {
  limit?: number
  page?: number
}

interface GameCreationParams {
  id: string
  title: string
  rating?: number
  status?: string
  review?: string
  plataform?: string
  first_release_date: Date | string
  storyline?: string
  cover_url: string
  slug: string
}

export const upsertGame = async (bodyParams: GameCreationParams) => {
  const {
    id,
    title,
    rating,
    status,
    review,
    plataform,
    first_release_date,
    storyline,
    cover_url,
    slug,
  } = bodyParams

  const query = `INSERT INTO "games" (id, title, rating, status, review, plataform, first_release_date, storyline, cover_url, slug)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    rating = EXCLUDED.rating,
    status = EXCLUDED.status,
    review = EXCLUDED.review,
    plataform = EXCLUDED.plataform,
    first_release_date = EXCLUDED.first_release_date,
    storyline = EXCLUDED.storyline,
    cover_url = EXCLUDED.cover_url,
    slug = EXCLUDED.slug
  RETURNING *;
`

  const values = [
    id,
    title,
    rating,
    status,
    review,
    plataform,
    first_release_date,
    storyline,
    cover_url,
    slug,
  ]

  const responseQuery: QueryResult = await pool.query(query, values)
  return responseQuery.rows[0]
}


type UpdateGameData = Partial<GameCreationParams>

export const getGameById = async (id: string): Promise<Game | undefined> => {
  const query = 'SELECT * FROM games WHERE id = $1'
  const getGames: QueryResult<Game> = await pool.query(query, [id])
  return getGames.rows[0]
}

export const getAllGamesDB = async (filters: GameFilters = {}): Promise<{ data: Game[], meta: { currentPage: number } }> => {
  const {
    limit = 10,
    page = 1,
  } = filters
  const offset = (page - 1) * limit
  const query = `SELECT * FROM games
    LIMIT $1 OFFSET $2`

  const params = [
    limit,
    offset,
  ]

  const responseQuery: QueryResult<Game> = await pool.query(query, params)

  return {
    data: responseQuery.rows,
    meta: {
      currentPage: page,
    },
  }
}

export const createGame = async (bodyParams: GameCreationParams) => {
  return await upsertGame(bodyParams)
}

export const updateGameDB = async (id: string, updateGameData: UpdateGameData) => {
  const keys = Object.keys(updateGameData)
  const values = Object.values(updateGameData)

  const setValues = keys
    .map((key, index) => {
      return `${key} = $${index + 1}`
    })
    .join(', ')

  const query = `UPDATE games SET ${setValues} WHERE id = $${values.length + 1} RETURNING *`
  const params = [...values, id]

  const responseQuery = await pool.query(query, params)

  return responseQuery
}

export const searchGamesByTitleDB = async (title: string): Promise<Game[]> => {
  const query = 'SELECT * FROM games WHERE LOWER(title) LIKE LOWER($1)'
  const searchPattern = `%${title}%`
  const result: QueryResult<Game> = await pool.query(query, [searchPattern])
  return result.rows
}
