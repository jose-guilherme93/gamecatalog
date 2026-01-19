

import { createServer } from 'node:http'
import { Server } from 'socket.io'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import userRoutes from './routes/userRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import reviewsRoutes from './routes/reviewsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import requestLogger from './utils/middlewares/requestLogger.js'
import logger from './scripts/logger.js'
import globalLimiter from './utils/middlewares/globalRateLimiter.js'
import authLimiter from './utils/middlewares/authRateLimiter.js'
import notFoundRoute from './utils/middlewares/notFoundRoute.js'
import docsRoutes from './routes/docsRoutes.js'

const PORT = Number(process.env.SERVER_PORT) || 3000

const app = express()
const httpServer = createServer(app)

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
export const io = new Server(httpServer)

app.use(helmet())
app.set('trust proxy', 1)

app.use(requestLogger)
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use((req, res, next) => {req.io = io; next()}  )

app.use(globalLimiter)
app.use('/auth', authLimiter)

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/games', gameRoutes)
app.use('/reviews', reviewsRoutes)
app.use('/payment', paymentRoutes)
app.use('/docs', docsRoutes)
app.get('/', (req, res) => res.status(200).json({
  message: 'Gamecatalog API',
  version: 'v0.1',
}))

app.use(notFoundRoute)

app.listen(PORT, '0.0.0.0', () => {
  logger.info('server is running')

})
