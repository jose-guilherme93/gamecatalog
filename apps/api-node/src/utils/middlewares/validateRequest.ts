import type { Request, Response, NextFunction } from 'express'
import { z, ZodError, type ZodSchema } from 'zod'

export const validateRequest = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            })
            next()
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: 'Erro de validação nos dados enviados.',
                    errors: error.issues.map((issue) => ({
                        path: issue.path,
                        message: issue.message,
                    })),
                })
            }
            next(error)
        }
    }
}
