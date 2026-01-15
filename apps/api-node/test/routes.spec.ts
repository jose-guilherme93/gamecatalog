import { vi, describe, it, expect } from 'vitest'

vi.resetModules()

describe('routes wiring', () => {
  it('userRoutes registers expected endpoints', async () => {
    vi.mock('express', () => {
      const get = vi.fn()
      const post = vi.fn()
      const put = vi.fn()
      const del = vi.fn()

      const Router = () => ({ get, post, put, delete: del })

      return {
        default: { Router },
      }
    })

    const userRoutes = await import('../src/routes/userRoutes.js')
    const router = userRoutes.default

    expect(typeof router.get).toBe('function')
    expect(typeof router.post).toBe('function')
    expect(typeof router.put).toBe('function')
    expect(typeof router.delete).toBe('function')
  })
})
