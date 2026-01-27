import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as gameModel from '../src/models/gameModel.js'

vi.mock('../src/models/gameModel.js', () => ({
  getGameById: vi.fn(),
  getAllGamesDB: vi.fn(),
  createGame: vi.fn(),
  updateGameDB: vi.fn(),
  searchGamesByTitleDB: vi.fn(),
  upsertGame: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}))

import axios from 'axios'
import * as gameCtrl from '../src/controllers/gameController.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('gameController', () => {
  const next = vi.fn()

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('upsertGameController', () => {
    it('should upsert a game and return 201', async () => {
      const gameData = { title: 'New Game', id: '1' }
      vi.mocked(gameModel.upsertGame).mockResolvedValue(gameData as any)

      const req: any = { body: gameData }
      const res = mockRes()
      await gameCtrl.upsertGameController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ game: gameData })
    })

    it('should call next on error', async () => {
      const error = new Error('DB Error')
      vi.mocked(gameModel.upsertGame).mockRejectedValue(error)

      const req: any = { body: {} }
      const res = mockRes()
      await gameCtrl.upsertGameController(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('getGameByIdController', () => {
    it('should return 404 if game not found', async () => {
      vi.mocked(gameModel.getGameById).mockResolvedValue(undefined)

      const req: any = { params: { id: 'nonexistent' } }
      const res = mockRes()
      await gameCtrl.getGameByIdController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Jogo não encontrado.' })
    })

    it('should return 200 and game if found', async () => {
      const gameData = { title: 'Found Game', id: '1' }
      vi.mocked(gameModel.getGameById).mockResolvedValue(gameData as any)

      const req: any = { params: { id: '1' } }
      const res = mockRes()
      await gameCtrl.getGameByIdController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ game: gameData })
    })
  })

  describe('getAllGames', () => {
    it('should return games list', async () => {
      const games = [{ title: 'G1' }, { title: 'G2' }]
      vi.mocked(gameModel.getAllGamesDB).mockResolvedValue({ data: games, meta: { currentPage: 1 } } as any)

      const req: any = { query: { limit: 10, page: 1 } }
      const res = mockRes()
      await gameCtrl.getAllGames(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ games })
    })
  })

  describe('createGameController', () => {
    it('should create a game and return 201', async () => {
      const gameData = { title: 'New Game' }
      vi.mocked(gameModel.createGame).mockResolvedValue({ rows: [gameData] } as any)

      const req: any = { body: gameData }
      const res = mockRes()
      await gameCtrl.createGameController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ game: gameData })
    })
  })

  describe('updateGameController', () => {
    it('should return 400 if no data provided', async () => {
      const req: any = { params: { id: '1' }, body: {} }
      const res = mockRes()
      await gameCtrl.updateGameController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 if game not found for update', async () => {
      vi.mocked(gameModel.updateGameDB).mockResolvedValue({ rows: [] } as any)

      const req: any = { params: { id: '1' }, body: { title: 'New' } }
      const res = mockRes()
      await gameCtrl.updateGameController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(404)
    })

    it('should update game and return 200', async () => {
      const updatedGame = { title: 'Updated' }
      vi.mocked(gameModel.updateGameDB).mockResolvedValue({ rows: [updatedGame] } as any)

      const req: any = { params: { id: '1' }, body: { title: 'Updated', slug: 'Updated Game' } }
      const res = mockRes()
      await gameCtrl.updateGameController(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ game: updatedGame })
    })
  })

  describe('searchGame', () => {
    it('should combine results from DB and RAWG API', async () => {
      const dbGames = [{ id: '1', title: 'Local Game', slug: 'local-game' }]
      const rawgGames = [{ id: 2, name: 'External Game', slug: 'external-game', background_image: 'url', released: '2021' }]

      vi.mocked(gameModel.searchGamesByTitleDB).mockResolvedValue(dbGames as any)
      vi.mocked(axios.get).mockResolvedValue({ data: { results: rawgGames } })

      const req: any = { query: { title: 'test' } }
      const res = mockRes()
      await gameCtrl.searchGame(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      const jsonResponse = res.json.mock.calls[0][0]
      expect(jsonResponse).toHaveLength(2)
      expect(jsonResponse[0].source).toBe('local')
      expect(jsonResponse[1].source).toBe('external')
    })

    it('should handle DB failure gracefully', async () => {
      vi.mocked(gameModel.searchGamesByTitleDB).mockRejectedValue(new Error('DB Fail'))
      vi.mocked(axios.get).mockResolvedValue({ data: { results: [] } })

      const req: any = { query: { title: 'test' } }
      const res = mockRes()
      await gameCtrl.searchGame(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
    })

    it('should handle RAWG API failure gracefully', async () => {
      vi.mocked(gameModel.searchGamesByTitleDB).mockResolvedValue([])
      vi.mocked(axios.get).mockRejectedValue(new Error('API Fail'))

      const req: any = { query: { title: 'test' } }
      const res = mockRes()
      await gameCtrl.searchGame(req, res, next)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith([])
    })
  })
})
