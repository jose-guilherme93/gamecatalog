import type { NextFunction, Response, Request } from 'express'

export const validateBodyFields = (requiredFields = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field]
      return value === undefined || value === null || value === ''
    })

    if (Object.keys(req.body).length <= 0 || missingFields.length > 0) {
      return res.status(400).json({
        message: `Campos obrigatórios ausentes para criar PUT: ${missingFields.join(', ')}`,
      })
    }

    next()
  }
}
