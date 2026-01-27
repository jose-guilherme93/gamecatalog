import type { Response, Request, NextFunction } from 'express'
import logger from '@/scripts/logger.js'
import { checkExistingReview, createReviewDB, deleteReviewDB, getReviewByIdDB, getReviewsByUserIdDB, updateReviewDB } from '../models/reviewModel.js'
import { z } from 'zod'
import type { Review } from '@/types/review.js'

export const createReviewSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    gameId: z.string().min(1),
    score: z.number().min(0).max(10),
    reviewText: z.string().min(1).max(5000),
  }),
})

export const deleteReviewSchema = z.object({
  params: z.object({
    user_id: z.string().uuid(),
    game_id: z.string().min(1),
  }),
})

export const updateReviewSchema = z.object({
  params: z.object({
    user_id: z.string().uuid(),
    game_id: z.string().min(1),
  }),
  body: z.object({
    score: z.number().min(0).max(10).optional(),
    review_text: z.string().min(1).max(5000).optional(),
  }),
})

export const reviewUserParamsSchema = z.object({
  params: z.object({
    user_id: z.string().uuid(),
  }),
})

export const reviewGameParamsSchema = z.object({
  params: z.object({
    game_id: z.string().min(1),
  }),
})

export async function getReviewsByUserIdController(req: Request, res: Response, next: NextFunction) {
  const { user_id } = req.params

  try {
    logger.info(`Buscando reviews para o usuário: ${user_id}`)
    const reviews = await getReviewsByUserIdDB(user_id as string)
    return res.status(200).json({
      message: 'Reviews encontrados com sucesso',
      reviews
    })
  } catch (error) {
    next(error)
  }
}

export async function getReviewByGameIdController(req: Request, res: Response, next: NextFunction) {
  const { game_id } = req.params

  try {
    logger.info(`Buscando reviews para o jogo: ${game_id}`)
    const reviews = await getReviewByIdDB(game_id as string)
    return res.status(200).json({
      message: 'Reviews encontrados com sucesso',
      reviews
    })
  } catch (error) {
    next(error)
  }
}

export async function createReviewController(req: Request, res: Response, next: NextFunction) {
  const { userId, gameId, score, reviewText } = req.body

  try {
    logger.info(`Criando nova review para o jogo ${gameId} pelo usuário ${userId}`)

    const checkResult = await checkExistingReview(userId, gameId)
    if (checkResult.rowCount! > 0) {
      logger.warn('Review já existe para este jogo e usuário.')
      return res.status(409).json({ error: 'Review já existe para este jogo e usuário.' })
    }

    const reviewData: Review = {
      user_id: userId,
      game_id: gameId,
      score,
      review_text: reviewText,
    }

    const newReview = await createReviewDB(reviewData as Required<Review>)
    if (!newReview) {
      return res.status(500).json({ error: 'Erro ao criar review no banco de dados.' })
    }

    return res.status(201).json({
      message: 'Review criado com sucesso',
      review: newReview
    })
  } catch (error) {
    next(error)
  }
}

export async function deleteReviewController(req: Request, res: Response, next: NextFunction) {
  const { user_id, game_id } = req.params

  try {
    logger.warn(`Deletando review do usuário ${user_id} para o jogo ${game_id}`)
    const result = await deleteReviewDB({ user_id: user_id as string, game_id: game_id as string })

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Review não encontrado para deletar' })
    }

    return res.status(200).json({ message: 'Review deletado com sucesso' })
  } catch (error) {
    next(error)
  }
}

export async function updateReviewController(req: Request, res: Response, next: NextFunction) {
  const { user_id, game_id } = req.params
  const { score, review_text } = req.body

  try {
    logger.info(`Atualizando review do usuário ${user_id} para o jogo ${game_id}`)

    const existingReview = await checkExistingReview(user_id as string, game_id as string)
    if (existingReview.rowCount === 0) {
      return res.status(404).json({ error: 'Review não encontrado para atualizar' })
    }

    const updatedReview = await updateReviewDB({
      user_id: user_id as string,
      game_id: game_id as string,
      score,
      review_text,
    })

    if (!updatedReview) {
      return res.status(500).json({ error: 'Erro ao atualizar review no banco de dados.' })
    }

    return res.status(200).json({
      message: 'Review atualizado com sucesso',
      review: updatedReview
    })
  } catch (error) {
    next(error)
  }
}
