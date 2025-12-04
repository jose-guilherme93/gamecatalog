import rateLimit from 'express-rate-limit'

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: JSON.stringify({ error: 'Too many authentication attempts, please try again after an hour.' }),
})

export default authLimiter
