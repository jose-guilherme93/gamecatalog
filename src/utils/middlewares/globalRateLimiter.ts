import rateLimit from 'express-rate-limit'

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({ error: 'Too many requests, please try again later.' }),
})

export default globalLimiter
