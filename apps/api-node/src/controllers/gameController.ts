import type { Request, Response } from 'express'
import { createGame, getAllGamesDB, getGameById, searchGamesByTitleDB, updateGameDB } from '@/models/gameModel.js'
import logger from '../scripts/logger.js'
import { gameApiSearch, gameTitleSearchSchema, type Game } from '@/types/game.js'
import type { QueryResult } from 'pg'
import * as z from 'zod'
import axios from 'axios'
const GameParamsSchema = z.object({
  id: z.string({ message: 'ID inválido.' }),
})

const CreateGameBodySchema = z.object({
  title: z.string(),
  rating: z.number(),
  status: z.string(),
  review: z.string(),
  slug: z.string(),
  storyline: z.string(),
  cover_url: z.string(),
  plataform: z.string(),
  first_release_date: z.string(),
})

const UpdateGameBodySchema = CreateGameBodySchema.partial()

export const getGameByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = GameParamsSchema.parse(req.params)
    const response = await getGameById(id)

    if (!response) {
      return res.status(404).json({ message: 'Jogo não encontrado.' })
    }
    res.status(200).json({ game: response })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos.', errors: error.issues })
    }
    logger.error('Erro ao buscar jogo por ID:', error)
    res.status(500).json({ message: 'Erro interno do servidor.',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

export const getAllGames = async (req: Request, res: Response) => {
  try {
    const { limit, page } = z.object({
      limit: z.coerce.number().int().positive().optional().default(10),
      page: z.coerce.number().int().positive().optional().default(1),
    }).parse(req.query)

    const filters = {
      limit,
      page,
    }
    const response = await getAllGamesDB(filters)
    res.status(200).json({ games: response.data })
  } catch(error) {
    logger.error(`Erro ao buscar todos os jogos: ${error}`)
    res.status(500).json({ message: 'Erro interno do servidor.', error })
  }
}

export const createGameController = async (req: Request, res: Response) => {
  logger.info('creating a game...')
  try {
    const bodyParams = CreateGameBodySchema.parse(req.body)

    const response: QueryResult = await createGame(bodyParams)

    logger.info(`game ${response.rows[0]?.title} created`)
    res.status(201).json({ game: response.rows[0] })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos para criação do jogo.', errors: error.issues })
    }
    logger.error('Erro ao criar jogo:', error)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}

export const updateGameController = async (req: Request, res: Response) => {
  try {
    const { id } = GameParamsSchema.parse(req.params)
    const updateGameData = UpdateGameBodySchema.parse(req.body)

    if (Object.keys(updateGameData).length === 0) {
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização.' })
    }

    logger.info(`body params to update a game: ${JSON.stringify(updateGameData)}`)

    if(updateGameData.slug) {
      updateGameData.slug = updateGameData.slug
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    logger.info('updating a game...')
    const updateGame: QueryResult<Game> = await updateGameDB(id, updateGameData as Partial<Game>)

    if(updateGame.rows.length > 0) {
      logger.info(`game ${updateGame.rows[0]!.title} updated.`)
      res.status(200).json({ game: updateGame.rows[0] })
    } else {
      logger.warn(`game with id ${id} not found for update`)
      res.status(404).json({ message: 'Jogo não encontrado.' })
    }
  } catch(error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Dados inválidos para atualização.', errors: error.message })
    }
    logger.error('Erro ao atualizar jogo no banco: ', error)
    res.status(500).json({ message: 'Erro interno do servidor.' })
  }
}

export async function searchGame(req: Request, res: Response) {

  const gameTitle = req.query.title
  const gameTitleParsed =  gameTitleSearchSchema.safeParse(gameTitle)
  const API_KEY = process.env.RAWG_API_KEY

  if(!gameTitleParsed.success) {
    res.json({ message: z.treeifyError(gameTitleParsed.error) })
  } else {
    const titleToSearch = gameTitleParsed.data

    try {
      // Search local database
      const dbGamesPromise = searchGamesByTitleDB(titleToSearch)

      // Search external RAWG API
      const rawgApiPromise = axios.get('https://api.rawg.io/api/games', {
        params: {
          key: API_KEY,
          search: titleToSearch,
          page_size: 10,
        },
      })

      const [dbGamesResult, rawgApiResult] = await Promise.allSettled([dbGamesPromise, rawgApiPromise])

      let combinedResults: { id: string, title: string, slug: string, cover_url: string, released?: string }[] = []

      // Process database results
      if (dbGamesResult.status === 'fulfilled') {
        dbGamesResult.value.forEach(game => {
          combinedResults.push({
            id: game.id,
            title: game.title,
            slug: game.slug,
            cover_url: game.cover_url,
            released: game.first_release_date ? new Date(game.first_release_date).toISOString().split('T')[0] : undefined,
          })
        })
      } else {
        logger.error('Error searching local database:', dbGamesResult.reason)
      }

      // Process RAWG API results
      if (rawgApiResult.status === 'fulfilled') {
        rawgApiResult.value.data.results.forEach((game: gameApiSearch) => {
          // Check for duplicates based on slug or title
          if (!combinedResults.some(dbGame => dbGame.slug === game.slug || dbGame.title === game.name)) {
            combinedResults.push({
              id: game.id.toString(), // Use game id as a unique identifier for API games
              title: game.name,
              slug: game.slug,
              cover_url: game.background_image,
              released: game.released,
            })
          }
        })
      } else {
        logger.error('Error searching external RAWG API:', rawgApiResult.reason)
      }

      return res.json(combinedResults)
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar jogos',
        info: error,
      })
    }
  }
}
