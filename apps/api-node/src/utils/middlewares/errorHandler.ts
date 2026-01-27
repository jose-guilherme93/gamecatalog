import type { Request, Response, NextFunction } from 'express'
import logger from '@/scripts/logger.js'

export interface AppError extends Error {
    status?: number
    errors?: any
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    const status = err.status || 500
    const message = err.message || 'Internal Server Error'

    if (status >= 500) {
        logger.error(`[Global Error] ${req.method} ${req.url} - ${message}`, {
            stack: err.stack,
            error: err,
        })
    } else {
        logger.warn(`[API Error] ${req.method} ${req.url} - ${message}`)
    }

    res.status(status).json({
        message,
        errors: err.errors || undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
}
