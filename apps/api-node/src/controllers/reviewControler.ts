import type { Response, Request } from 'express'
import logger from '@/scripts/logger.js'
import { checkExistingReview, createReviewDB, deleteReviewDB, getReviewByIdDB, getReviewsByUserIdDB, updateReviewDB } from '../models/reviewModel.js'
import * as zod from 'zod'
import type { Review } from '@/types/review.js'

const createReviewSchema = zod.object({
  user_id: zod.string(),
  game_id: zod.string(),
  score: zod.number().min(0).max(10),
  review_text: zod.string().min(1).max(500),
}) satisfies zod.ZodType<Review>

const deleteReviewParamsSchema = zod.object({
  user_id: zod.uuid(),
  game_id: zod.string().min(1),
})

const updateReviewParamsSchema = zod.object({
  user_id: zod.uuid(),
  game_id: zod.string().min(1),
})

const updateReviewBodyParamsSchema = zod.object({
  score: zod.number().min(0).max(10).optional(),
  review_text: zod.string().min(1).max(5000).optional(),
})
const userIdSchema = zod.string().uuid()

export async function getReviewsByUserIdController(req: Request, res: Response) {
  logger.info('buscando review por user_id...')
  const parseUserId = userIdSchema.safeParse(req.params.user_id)

  if (!parseUserId.success) {
    logger.error('Invalid user_id format')
    return res.status(400).json({ message: 'Invalid user_id format' })
  }

  const searchReview = await getReviewsByUserIdDB(parseUserId.data!)
  res.status(200).json({ message: 'Reviews encontrados com sucesso', reviews: searchReview })
}

export async function getReviewByGameIdController(req: Request, res: Response) {
  logger.info('buscando review por game_id...')
  const parseReviewGameId = req.params.game_id
  const gameIdSchema = zod.string().min(1)
  const parsedGameId = gameIdSchema.safeParse(parseReviewGameId)
  if (!parsedGameId.success) {
    logger.error('Invalid game_id format')
    return res.status(400).json({ message: 'Invalid game_id format' })
  }
  const searchReview = await getReviewByIdDB(parsedGameId.data)
  res.status(200).json({ message: 'Review encontrado com sucesso', review: searchReview })
}

export async function createReviewController(req: Request, res: Response) {
  logger.info('criando nova review...')
  const reqParams: Review = {
    review_text: req.body.review_text,
    score: req.body.score,
    game_id: req.body.game_id,
    user_id: req.body.user_id,
  }
  createReviewSchema.safeParse(reqParams)
  try {

    const checkResult = await checkExistingReview(reqParams.user_id, reqParams.game_id)

    if (checkResult.rowCount! > 0) {
      logger.warn('Review já existe para este jogo e usuário.')
      return res.status(409).json({ error: 'Review já existe para este jogo e usuário.' })
    }

    const newReview = await createReviewDB(reqParams as Required<Review>)
    if(!newReview) {
      logger.error('Erro ao criar review no banco de dados.')
      return res.status(500).json({ error: 'Erro ao criar review no banco de dados.' })
    }
    res.status(201).json({ message: 'Review criado com sucesso', review: newReview })
  } catch (err) {
    logger.error('Erro ao criar review Controller:', err)
    res.status(500).json({ error: 'Erro ao criar review', message: 'game não encontrado' })
  }
}

export async function deleteReviewController(req: Request, res: Response) {
  logger.info('deletando review...')
  const reqParams = {
    game_id:  req.params.game_id!,
    user_id: req.params.user_id!,
  }

  if (!reqParams.game_id || !reqParams.user_id) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' })
  }

  const parsedParams = deleteReviewParamsSchema.safeParse(reqParams)
  if(parsedParams.error) {
    logger.error(`Parâmetros inválidos para deletar review:', ${parsedParams.error}`)
    return res.status(400).json({ error: 'Parâmetros inválidos para deletar review' })
  }

  try {
    const searchReview = await deleteReviewDB(reqParams)

    if(searchReview.rowCount! == 0) {
      logger.warn('Review não encontrado para deletar.')
      return res.status(404).json({ error: 'Review não encontrado para deletar' })
    }
    logger.info(`Review deletado com sucesso: ${searchReview}`)
    res.status(200).json({ message: 'Review deletado com sucesso' })
  } catch (err) {
    logger.error('Erro ao deletar review:', err)
    res.status(500).json({ error: 'Erro ao deletar review' })
  }
}

export async function updateReviewController(req: Request, res: Response) {
  logger.info('Atualizando review...')

  const reqParams = {
    user_id: req.params.user_id!,
    game_id: req.params.game_id!,
  }

  const reqBody = {
    score: req.body?.score,
    review_text: req.body?.review_text,
  }

  const parsedParams = updateReviewParamsSchema.safeParse(reqParams)
  const parsedBody = updateReviewBodyParamsSchema.safeParse(reqBody)

  if(parsedParams.error) {
    logger.info(parsedParams.data)
    logger.error(`Parâmetros inválidos para atualizar review: ${parsedParams.error.message}`)
    return res.status(400).json({ error: 'Parâmetros inválidos para atualizar review' })
  }
  if(parsedBody.error) {
    logger.info(parsedBody.data)
    logger.error(`Dados inválidos para atualizar review: ${parsedBody.error.message}`)
    return res.status(400).json({ error: 'Dados inválidos para atualizar review' })
  }

  try {

    const existingReview = await checkExistingReview(parsedParams.data.user_id, parsedParams.data.game_id)
    if(existingReview.rowCount === 0) {
      logger.warn('Review não encontrado para atualizar.')
      return res.status(404).json({ error: 'Review não encontrado para atualizar' })
    }

    const updateReview = await updateReviewDB({
      user_id: parsedParams.data.user_id!,
      game_id: parsedParams.data.game_id!,
      score: parsedBody.data.score!,
      review_text: parsedBody.data.review_text!,

    })
    if(!updateReview) {
      logger.error('Erro ao atualizar review no banco de dados.')
      return res.status(500).json({ error: 'Erro ao atualizar review no banco de dados.' })
    }
    res.status(200).json({ message: 'Review atualizado com sucesso', review: updateReview })

  } catch(err) {
    logger.error('error ao atualizar review:', err)
    res.status(500).json({ error: 'errro ao atualizar review', err })
  }

}
