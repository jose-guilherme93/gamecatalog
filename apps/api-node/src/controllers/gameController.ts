import type { Request, Response, NextFunction } from 'express'
import { createGame, getAllGamesDB, getGameById, searchGamesByTitleDB, updateGameDB, upsertGame } from '@/models/gameModel.js'
import logger from '../scripts/logger.js'
import { type gameApiSearch, gameTitleSearchSchema, type Game } from '@/types/game.js'
import type { QueryResult } from 'pg'
import { z } from 'zod'
import axios from 'axios'

export const gameParamsSchema = z.object({
  params: z.object({
    id: z.string({ message: 'ID inválido.' }),
  }),
})

export const createGameSchema = z.object({
  body: z.object({
    id: z.string(),
    title: z.string(),
    rating: z.number().optional(),
    status: z.string().optional(),
    review: z.string().optional(),
    slug: z.string(),
    storyline: z.string().optional(),
    cover_url: z.string(),
    plataform: z.string().optional(),
    first_release_date: z.string(),
  }),
})

export const updateGameSchema = z.object({
  params: z.object({
    id: z.string({ message: 'ID inválido.' }),
  }),
  body: z.object({
    title: z.string().optional(),
    rating: z.number().optional(),
    status: z.string().optional(),
    review: z.string().optional(),
    slug: z.string().optional(),
    storyline: z.string().optional(),
    cover_url: z.string().optional(),
    plataform: z.string().optional(),
    first_release_date: z.string().optional(),
  }),
})

export const getAllGamesSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().optional().default(10),
    page: z.coerce.number().int().positive().optional().default(1),
  }),
})

export const searchGameSchema = z.object({
  query: z.object({
    title: z.string().min(1, 'Título é obrigatório para busca.'),
  }),
})

export const upsertGameController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Upserting game...')
    const response = await upsertGame(req.body)

    logger.info(`Game ${response.title} upserted`)
    return res.status(201).json({ game: response })
  } catch (error) {
    next(error)
  }
}

export const getGameByIdController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  try {
    const response = await getGameById(id as string)

    if (!response) {
      return res.status(404).json({ message: 'Jogo não encontrado.' })
    }
    return res.status(200).json({ game: response })
  } catch (error) {
    next(error)
  }
}

export const getAllGames = async (req: Request, res: Response, next: NextFunction) => {
  const { limit, page } = req.query as any

  try {
    const response = await getAllGamesDB({ limit, page })
    return res.status(200).json({ games: response.data })
  } catch (error) {
    next(error)
  }
}

export const createGameController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Creating game...')
    const response: QueryResult = await createGame(req.body)

    logger.info(`Game ${response.rows[0]?.title} created`)
    return res.status(201).json({ game: response.rows[0] })
  } catch (error) {
    next(error)
  }
}

export const updateGameController = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  const updateGameData = { ...req.body }

  try {
    if (Object.keys(updateGameData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' })
    }

    if (updateGameData.slug) {
      updateGameData.slug = updateGameData.slug
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    logger.info(`Updating game ${id}...`)
    const result: QueryResult<Game> = await updateGameDB(id as string, updateGameData)

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Jogo não encontrado.' })
    }

    logger.info(`Game ${result.rows[0]!.title} updated.`)
    return res.status(200).json({ game: result.rows[0] })
  } catch (error) {
    next(error)
  }
}

export async function searchGame(req: Request, res: Response, next: NextFunction) {
  const { title } = req.query as { title: string }
  const API_KEY = process.env.RAWG_API_KEY

  try {
    logger.info(`Buscando jogos com título: ${title}`)

    // Search local database and external RAWG API concurrently
    const dbGamesPromise = searchGamesByTitleDB(title)
    const rawgApiPromise = axios.get('https://api.rawg.io/api/games', {
      params: {
        key: API_KEY,
        search: title,
        page_size: 10,
      },
      timeout: 5000, // Reasonable timeout
    })

    const [dbGamesResult, rawgApiResult] = await Promise.allSettled([dbGamesPromise, rawgApiPromise])

    let combinedResults: any[] = []

    // Process database results
    if (dbGamesResult.status === 'fulfilled' && Array.isArray(dbGamesResult.value)) {
      dbGamesResult.value.forEach(game => {
        combinedResults.push({
          id: game.id,
          title: game.title,
          slug: game.slug,
          cover_url: game.cover_url || '',
          released: game.first_release_date || '',
          source: 'local'
        })
      })
    } else if (dbGamesResult.status === 'rejected') {
      logger.error('Error searching local database:', dbGamesResult.reason)
    }

    // Process RAWG API results
    if (rawgApiResult.status === 'fulfilled' && rawgApiResult.value.data && Array.isArray(rawgApiResult.value.data.results)) {
      rawgApiResult.value.data.results.forEach((game: gameApiSearch) => {
        // Check for duplicates
        if (!combinedResults.some(item => item.slug === game.slug || item.title === game.name)) {
          combinedResults.push({
            id: game.id.toString(),
            title: game.name,
            slug: game.slug,
            cover_url: game.background_image,
            released: game.released || '',
            source: 'external'
          })
        }
      })
    } else if (rawgApiResult.status === 'rejected') {
      logger.error('Error searching external RAWG API:', rawgApiResult.reason)
    }

    return res.status(200).json(combinedResults)
  } catch (error) {
    next(error)
  }
}
