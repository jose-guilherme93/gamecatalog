import { createClient } from 'redis'
import '@/env.js'

export const rdb = createClient({
  url: process.env.REDIS_URL!
})

rdb.on('error', (err) => console.error('Redis Client Error', err))

await rdb.connect() 