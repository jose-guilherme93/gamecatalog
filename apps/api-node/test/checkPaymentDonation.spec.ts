import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as paymentCtrl from '../src/controllers/paymentController.js'
import { getDonationByExternalId, updateDonationPaymentDB } from '../src/models/paymentModel.js'
import { rdb } from '../src/utils/redis.js'

vi.mock('../src/models/paymentModel.js', () => ({
    createDonationPaymentDB: vi.fn(),
    updateDonationPaymentDB: vi.fn(),
    getDonationByExternalId: vi.fn(),
}))

vi.mock('../src/utils/redis.js', () => ({
    rdb: {
        lPush: vi.fn(),
        get: vi.fn(),
        setEx: vi.fn(),
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

describe('checkPaymentDonation', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        process.env.ABACATE_PAY_API = 'test-token'
    })

    it('returns 404 if donation not found in DB', async () => {
        vi.mocked(getDonationByExternalId).mockResolvedValue(null)
        const req: any = { body: { id: 'non-existent' }, user: { userId: 'user-123' } }
        const res = mockRes()

        await paymentCtrl.checkPaymentDonation(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ message: 'Doação não encontrada' })
    })

    it('returns 403 if donation belongs to another user', async () => {
        const mockDonation = {
            external_id: 'ext-123',
            status: 'PENDING',
            amount: 1000,
            user_id: 'other-user'
        }
        vi.mocked(getDonationByExternalId).mockResolvedValue(mockDonation)
        const req: any = { body: { id: 'ext-123' }, user: { userId: 'my-user' } }
        const res = mockRes()

        await paymentCtrl.checkPaymentDonation(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({ message: 'Acesso negado' })
    })

    it('returns status from DB if not PENDING (optimization & IDOR fix)', async () => {
        const mockDonation = {
            external_id: 'ext-123',
            status: 'PAID',
            amount: 1000,
            user_id: 'user-123',
            customer_data: { email: 'leak@me.com' } // Should not be returned
        }
        vi.mocked(getDonationByExternalId).mockResolvedValue(mockDonation)
        const req: any = { body: { id: 'ext-123' }, user: { userId: 'user-123' } }
        const res = mockRes()

        await paymentCtrl.checkPaymentDonation(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            data: {
                id: 'ext-123',
                status: 'PAID',
                amount: 1000,
                pixCode: undefined, // Or mock values if provided
                brCode: undefined,
                brCodeBase64: undefined
            }
        })
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns status from DB if on cooldown (resource saving)', async () => {
        const mockDonation = { external_id: 'ext-123', status: 'PENDING', amount: 1000, user_id: 'user-123' }
        vi.mocked(getDonationByExternalId).mockResolvedValue(mockDonation)
        vi.mocked(rdb.get).mockResolvedValue('true')
        const req: any = { body: { id: 'ext-123' }, user: { userId: 'user-123' } }
        const res = mockRes()

        await paymentCtrl.checkPaymentDonation(req, res, vi.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            data: {
                id: 'ext-123',
                status: 'PENDING',
                amount: 1000,
                pixCode: undefined,
                brCode: undefined,
                brCodeBase64: undefined
            }
        })
        expect(global.fetch).not.toHaveBeenCalled()
    })

    it('calls external API if PENDING and no cooldown, then updates DB and sets cooldown', async () => {
        const mockDonation = { external_id: 'ext-123', status: 'PENDING', amount: 1000 }
        vi.mocked(getDonationByExternalId).mockResolvedValue(mockDonation)
        vi.mocked(rdb.get).mockResolvedValue(null)

        const mockApiResponse = {
            data: {
                status: 'PAID',
                id: 'pix-123',
                payment: { fee: 50 },
                amount: 1000,
                brCode: 'qr-code-data',
                brCodeBase64: 'base64-data'
            }
        }
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => mockApiResponse
        } as any)

        const req: any = { body: { id: 'ext-123' }, user: { userId: 'user-123' } }
        const donationWithUser = { ...mockDonation, user_id: 'user-123' }
        vi.mocked(getDonationByExternalId).mockResolvedValue(donationWithUser)

        const res = mockRes()

        await paymentCtrl.checkPaymentDonation(req, res, vi.fn())

        expect(global.fetch).toHaveBeenCalled()
        expect(updateDonationPaymentDB).toHaveBeenCalledWith(
            'ext-123',
            null,
            'pix-123',
            'PAID',
            50,
            mockApiResponse.data,
            null,
            null
        )
        expect(rdb.setEx).toHaveBeenCalledWith('pix:check:cooldown:ext-123', 30, 'true')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
            data: {
                id: 'ext-123',
                status: 'PAID',
                amount: 1000,
                pixCode: 'qr-code-data',
                brCode: 'qr-code-data',
                brCodeBase64: 'base64-data'
            }
        })
    })
})
