import { NextFunction, Response, Request } from 'express'
import jwt from 'jsonwebtoken'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token não fornecido' })

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) return res.status(500).json({ message: 'JWT_SECRET undefined' })

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' })
    req.user = user
    next()
  })
}
