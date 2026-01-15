import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../src/models/gameModel.js', () => ({
  getGameById: vi.fn(),
  getAllGamesDB: vi.fn(),
  createGame: vi.fn(),
  updateGameDB: vi.fn(),
}))
vi.mock('axios', () => ({ get: vi.fn() }))

import * as gameCtrl from '../src/controllers/gameController.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('gameController', () => {
  beforeEach(() => vi.resetAllMocks())

  it('getGameByIdController returns 404 when not found', async () => {
    const { getGameById } = await import('../src/models/gameModel.js') as any
    getGameById.mockResolvedValue(undefined)

    const req: any = { params: { id: 'x' } }
    const res = mockRes()
    await gameCtrl.getGameByIdController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('searchGame calls external API and returns results', async () => {
    const axios = await import('axios') as any
    axios.get.mockResolvedValue({ data: { results: [{ name: 'Game', slug: 'g', background_image: '', released: '2020' }] } })

    const req: any = { query: { title: 'z' } }
    const res = mockRes()
    await gameCtrl.searchGame(req, res)

    expect(res.json).toHaveBeenCalled()
  })
})
