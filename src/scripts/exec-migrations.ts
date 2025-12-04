import * as dotenv from 'dotenv'
import * as path from 'path'
const env = process.env.NODE_ENV || 'development'
const envFile = `.env.${env}`
dotenv.config({ path: path.resolve(process.cwd(), envFile) })
import { Client } from 'pg'
import fs from 'node:fs'

import { fileURLToPath } from 'node:url'
import logger from './logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const client = new Client({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : undefined,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
})

async function ensureMigrationsTable() {
  await client.query(`CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getExecutedMigrations() {
  const res = await client.query('SELECT name FROM migrations')
  return res.rows.map((r) => r.name)
}

async function runMigrations() {
  try {
    await client.connect()

    await ensureMigrationsTable()

    const migrationsDir = path.join(__dirname, '../migrations')
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))

    const executedMigrations = await getExecutedMigrations()

    for (const file of files) {
      if (executedMigrations.includes(file)) {
        logger.info(`Skipping already executed migration: ${file}`)
        continue
      }

      const filePath = path.join(migrationsDir, file)
      const sql = fs.readFileSync(filePath, 'utf-8')

      try {
        await client.query(sql)
        await client.query('INSERT INTO migrations(name) VALUES($1)', [file])
        logger.info(`Migration executed: ${file}`)
      } catch (err) {
        console.error(`Error running migration ${file}:`, err)
        process.exit(1)
      }
    }

    logger.info('All migrations executed!')
  } catch (err) {
    console.error('Erro ao conectar ou executar migrations:', err)
  } finally {
    await client.end()
    logger.info('Conexão encerrada')
  }
}

runMigrations()
