import * as dotenv from 'dotenv'
import * as path from 'path'
const env = process.env.NODE_ENV || 'dev'
const envFile = `.env.${env}`
dotenv.config({ path: path.resolve(process.cwd(), envFile), quiet: true })
import { Pool } from 'pg'
import logger from '../scripts/logger.js'

logger.info(process.env.DATABASE_URL)
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
// Loga quando a conexão é estabelecida
pool.on('connect', () => {
  logger.info('Database connected')
})

pool.on('error', (err) => {
  logger.error(`🔴 error on connect to database: ${err.message}`)
})
