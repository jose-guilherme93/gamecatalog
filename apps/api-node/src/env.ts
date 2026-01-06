import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'
import logger from './scripts/logger'

const currentEnv = process.env.NODE_ENV || 'dev'


const envFiles: Record<string, string> = {
  dev: '.env.dev',
  prod: '.env.prod',
  act: '.env.act',
  test: '.env.test'
}

const targetFile = envFiles[currentEnv] || '.env.dev'
const envPath = resolve(import.meta.dirname, '../../../', targetFile)


config({ path: envPath, debug: currentEnv === 'dev', encoding: 'utf8' })

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'prod', 'test', 'act']).default('dev'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  logger.error('Invalid environment variables:', _env.error.format())
  throw new Error('Invalid environment variables.')
}

export const env = _env.data