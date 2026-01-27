import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.resetModules()

const listen = vi.fn()
const use = vi.fn()
const set = vi.fn()
const appMock = () => ({ use, set, get: vi.fn(), listen })

vi.mock('express', () => {
  const fn = () => appMock()
  fn.json = () => (req: any, res: any, next: any) => next()
  fn.urlencoded = () => (req: any, res: any, next: any) => next()
  fn.Router = () => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), use: vi.fn() })
  return { default: fn }
})

vi.mock('node:http', () => ({ createServer: () => ({ listen }) }))
vi.mock('socket.io', () => ({ Server: vi.fn(() => ({})) }))
vi.mock('cors', () => ({ default: () => (req: any, res: any, next: any) => next() }))
vi.mock('helmet', () => ({ default: () => (req: any, res: any, next: any) => next() }))
vi.mock('../src/routes/userRoutes.js', () => ({ default: { path: '/users' } }))
vi.mock('../src/routes/gameRoutes.js', () => ({ default: { path: '/games' } }))
vi.mock('../src/routes/reviewsRoutes.js', () => ({ default: { path: '/reviews' } }))
vi.mock('../src/routes/authRoutes.js', () => ({ default: { path: '/auth' } }))
vi.mock('../src/routes/paymentRoutes.js', () => ({ default: { path: '/payment' } }))
vi.mock('../src/routes/docsRoutes.js', () => ({ default: { path: '/docs' } }))
vi.mock('../src/utils/middlewares/requestLogger.js', () => ({ default: () => (req: any, res: any, next: any) => next() }))
vi.mock('../src/utils/middlewares/globalRateLimiter.js', () => ({ default: () => (req: any, res: any, next: any) => next() }))
vi.mock('../src/utils/middlewares/authRateLimiter.js', () => ({ default: () => (req: any, res: any, next: any) => next() }))
vi.mock('../src/utils/middlewares/notFoundRoute.js', () => ({ default: () => (req: any, res: any) => res.status(404) }))

describe('server.ts wiring', () => {
  beforeEach(() => vi.resetAllMocks())

  it('imports server without actually listening to network (listen is called on app mock)', async () => {
    const serverModule = await import('../src/server.ts')
    // Our mock listen should have been called
    expect(listen).toHaveBeenCalled()
    expect(serverModule).toBeDefined()
  })
})
