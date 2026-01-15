import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../src/models/paymentModel.js', () => ({
  createDonationPaymentDB: vi.fn(),
  updateDonationPaymentDB: vi.fn(),
}))
vi.mock('../src/utils/redis.js', () => ({ rdb: { lPush: vi.fn() } }))

import * as paymentCtrl from '../src/controllers/paymentController.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('paymentController', () => {
  beforeEach(() => vi.resetAllMocks())

  it('handleAbacatePayWebhook rejects invalid secret', async () => {
    const req: any = { query: { webhookSecret: 'bad' }, body: {} }
    const res = mockRes()
    await paymentCtrl.handleAbacatePayWebhook(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
