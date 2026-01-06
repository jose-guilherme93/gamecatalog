import { createClient, RedisClientType } from 'redis'
import '@/env.js'

export const rdb: RedisClientType = createClient({
  url: process.env.REDIS_URL!
})

rdb.on('error', (err) => console.error('Redis Client Error', err))

await rdb.connect() 