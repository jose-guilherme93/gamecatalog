import type { JwtPayload } from 'jsonwebtoken'
import { Server } from 'socket.io'
export {}

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | undefined
      io?: Server
    }
  }
}
