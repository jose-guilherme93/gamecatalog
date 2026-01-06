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
  title: string
  rating: number
  status: string
  review: string
  plataform: string
  first_release_date: Date | string
  storyline: string
  cover_url: string
  slug: string
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
  const  {
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

  const query = `INSERT INTO "games" (title,
        rating,
        status,
        review,
        plataform,
        first_release_date,
        storyline,
        cover_url,
        slug) 
  VALUES ($1,$2, $3, $4, $5, $6,$7,$8,$9) 
  RETURNING *;
`

  const values = [
    title, rating, status, review, plataform, first_release_date, storyline, cover_url, slug,
  ]

  const responseQuery: QueryResult = await pool.query(query, values)
  return responseQuery.rows[0]
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
