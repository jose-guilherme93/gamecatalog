import * as dotenv from 'dotenv'
import * as path from 'path'
import cors from 'cors'
import express from 'express'
import userRoutes from './routes/userRoutes.js'
import gameRoutes from './routes/gameRoutes.js'
import reviewsRoutes from './routes/reviewsRoutes.js'
import authRoutes from './routes/authRoutes.js'
import { logger } from './scripts/logger.js'
import { requestLogger } from './utils/middlewares.js'

const env = process.env.NODE_ENV || 'development'
const envFile = `.env.${env}`
dotenv.config({ path: path.resolve(process.cwd(), envFile), quiet: true })

const PORT = Number(process.env.SERVER_PORT) || 3000

const app = express()
app.use(cors())
app.use(requestLogger)
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

app.use('/favicon.png', (req, res) => res.status(204).end())
app.get('/', (req, res) => res.status(200).json({
  message: 'Gamecatalog API',
  version: 'v0.1',
}))

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/games', gameRoutes)
app.use('/reviews', reviewsRoutes)

app.use((req, res) => {
  logger.warn(`Route no found: ${req.originalUrl}`)
  res.status(404).json({
    error: {
      message: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date().toISOString() } })
})

app.listen(PORT, '0.0.0.0', () => {
  logger.info('server is running')

})
