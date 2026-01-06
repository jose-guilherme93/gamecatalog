import logger from '@/scripts/logger.js'
import type{ Response, Request, NextFunction  } from 'express'
import { finished } from 'node:stream'

/**
 * @description Cria um middleware do Express para loggar detalhes de requisições HTTP
 * no logger Winston após a resposta ser enviada.
 *
 * @param {Request} req - Objeto de requisição do Express
 * @param {Response} res - Objeto de resposta do Express
 * @param {NextFunction} next - Função para passar para o próximo middleware
 */
const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {

  const start = Date.now()

  finished(res, (err) => {
    const duration = Date.now() - start
    const { method, url, originalUrl } = req
    const userAgent = req.headers['user-agent']
    const ip = req.ip || req.socket.remoteAddress || 'Unknown'
    const { statusCode } = res

    if (err) {
      logger.error(`[HTTP-Error] Falha ao logar requisição para ${method} ${url}: ${err.message}`)
      return
    }

    const logMessage = `[HTTP] ${ip} - User Agent: ${userAgent} - ${method} ${originalUrl} - Status: ${statusCode} - Time: ${duration}ms`

    if (statusCode >= 500) logger.error(logMessage)
    else if (statusCode >= 400) logger.warn(logMessage)
    else logger.info(logMessage)
  })

  next()
}

export default requestLogger
