import logger from '@/scripts/logger.js'
import type { Response, Request } from 'express'
async function notFoundRoute(req: Request, res: Response) {
  logger.warn(`Route no found: ${req.originalUrl}`)
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString() } })
}

export default notFoundRoute
