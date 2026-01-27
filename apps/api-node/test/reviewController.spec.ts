import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../src/models/reviewModel.js', () => ({
  checkExistingReview: vi.fn(),
  createReviewDB: vi.fn(),
  deleteReviewDB: vi.fn(),
  getReviewByIdDB: vi.fn(),
  updateReviewDB: vi.fn(),
}))

import * as reviewCtrl from '../src/controllers/reviewController.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('reviewController', () => {
  beforeEach(() => vi.resetAllMocks())

  it('getReviewByGameIdController returns 200 with review', async () => {
    const { getReviewByIdDB } = await import('../src/models/reviewModel.js') as any
    getReviewByIdDB.mockResolvedValue({ id: 'r' })

    const req: any = { params: { game_id: 'g1' } }
    const res = mockRes()
    const next = vi.fn()
    await reviewCtrl.getReviewByGameIdController(req, res, next)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('createReviewController returns 201 when created', async () => {
    const { checkExistingReview, createReviewDB } = await import('../src/models/reviewModel.js') as any
    checkExistingReview.mockResolvedValue({ rowCount: 0 })
    createReviewDB.mockResolvedValue({ id: 'new' })

    const req: any = { body: { userId: 'u', gameId: 'g', score: 5, reviewText: 'ok' } }
    const res = mockRes()
    const next = vi.fn()
    await reviewCtrl.createReviewController(req, res, next)

    expect(res.status).toHaveBeenCalledWith(201)
  })
})
