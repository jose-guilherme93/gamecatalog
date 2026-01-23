
import { Pool } from 'pg'
import logger from '../scripts/logger.js'


let URL_DB
if (!process.env.DATABASE_URL) {
  URL_DB = "postgresql://postgres:123postgres@localhost:5432/gamecatalog-db"
}
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || URL_DB,
})
pool.on('connect', () => {
  logger.info('Database connected')
})

pool.on('error', (err) => {
  logger.error(`🔴 error on connect to database: ${err.message}`)
})
