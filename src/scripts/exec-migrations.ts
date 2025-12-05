import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import logger from './logger.js'
import { pool } from '@/utils/connectDatabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function ensureMigrationsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function getExecutedMigrations() {
  const res = await pool.query('SELECT name FROM migrations')
  return res.rows.map((r) => r.name)
}

async function runMigrations() {
  let migrationFailed = false
  let client

  try {
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

      client = await pool.connect()
      try {
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('INSERT INTO migrations(name) VALUES($1)', [file])
        await client.query('COMMIT')
        logger.info(`Migration executed: ${file}`)
      } catch (err) {

        await client.query('ROLLBACK')
        console.error(`Error running migration ${file}:`, err)
        migrationFailed = true
        break
      } finally {
        if (client) {
          client.release()
          client = null
        }
      }

      if (migrationFailed) {
        break
      }
    }

    if (!migrationFailed) {
      logger.info('All migrations executed!')
    }
  } catch (err) {

    console.error('Erro fatal ao conectar ou executar migrations:', err)
    migrationFailed = true
  } finally {

    await pool.end()
    logger.info('Conexão encerrada')

    if (migrationFailed) {

      process.exit(1)
    } else {

      process.exit(0)
    }
  }
}

runMigrations()
