import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as paymentCtrl from '../src/controllers/paymentController.js'
import { createDonationPaymentDB } from '../src/models/paymentModel.js'
import { rdb } from '../src/utils/redis.js'

vi.mock('../src/models/paymentModel.js', () => ({
    createDonationPaymentDB: vi.fn(),
    updateDonationPaymentDB: vi.fn(),
}))

vi.mock('../src/utils/redis.js', () => ({
    rdb: {
        lPush: vi.fn(),
    },
}))

// Mock global fetch
global.fetch = vi.fn()

function mockRes() {
    const res: any = {}
    res.status = vi.fn(() => res)
    res.json = vi.fn(() => res)
    return res
}

describe('createDonationPayment', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        process.env.ABACATE_PAY_API = 'test-token'
    })

    it('correctly passes the AbacatePay ID to createDonationPaymentDB', async () => {
        const mockAbacateId = 'abc_123'
        const mockApiResponse = {
            data: {
                id: mockAbacateId,
                pixCode: 'qr-code-data'
            }
        }

        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        } as any)

        vi.mocked(createDonationPaymentDB).mockResolvedValue({ rowCount: 1 } as any)

        const req: any = {
            body: {
                amount: 1000,
                customer: { email: 'test@test.com' },
                description: 'test',
                metadata: { externalId: 'user-id-456' }
            }
        }
        const res = mockRes()

        await paymentCtrl.createDonationPayment(req, res, vi.fn())

        expect(createDonationPaymentDB).toHaveBeenCalledWith(expect.objectContaining({
            externalId: mockAbacateId // This is what we want!
        }))

        expect(res.status).toHaveBeenCalledWith(201)
    })
})
