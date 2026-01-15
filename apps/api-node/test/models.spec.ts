import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../src/utils/connectDatabase.js', () => ({ pool: { query: vi.fn() } }))

describe('models basic behavior', () => {
  beforeEach(() => vi.resetAllMocks())

  it('userModel.checkUser calls pool.query with email', async () => {
    const { pool } = await import('../src/utils/connectDatabase.js') as any
    pool.query.mockResolvedValue({ rows: [] })

    const userModel = await import('../src/models/userModel.js') as any
    await userModel.checkUser({ email: 'a@b.com' })

    expect(pool.query).toHaveBeenCalled()
  })

  it('gameModel.getGameById returns undefined when no row', async () => {
    const { pool } = await import('../src/utils/connectDatabase.js') as any
    pool.query.mockResolvedValue({ rows: [] })

    const gameModel = await import('../src/models/gameModel.js') as any
    const res = await gameModel.getGameById('x')
    expect(res).toBeUndefined()
  })
})
