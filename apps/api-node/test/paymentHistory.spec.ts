import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the pool
const mockClient = {
    query: vi.fn(),
    release: vi.fn(),
}
vi.mock('../src/utils/connectDatabase.js', () => ({
    pool: {
        connect: vi.fn(() => Promise.resolve(mockClient)),
        query: vi.fn(),
    },
}))

import { createDonationPaymentDB, updateDonationPaymentDB } from '../src/models/paymentModel.js'

describe('paymentModel history tracking', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockClient.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 'test-uuid' }] })
    })

    it('createDonationPaymentDB inserts into donation_status_history', async () => {
        const data: any = {
            id: 'test-uuid',
            externalId: 'ext-123',
            amount: 1000,
            platformFee: 80,
            customer: { name: 'Test' },
            description: 'Test desc',
            userId: 'user-uuid'
        }

        await createDonationPaymentDB(data)

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN')
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO donations'),
            expect.anything()
        )
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO donation_status_history'),
            ['test-uuid', 'PENDING', JSON.stringify({ message: 'Donation initiated' })]
        )
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT')
        expect(mockClient.release).toHaveBeenCalled()
    })

    it('updateDonationPaymentDB inserts into donation_status_history on status change', async () => {
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'test-uuid', status: 'PAID' }] }) // UPDATE
            .mockResolvedValueOnce({}) // INSERT HISTORY
            .mockResolvedValueOnce({}) // COMMIT

        const payload = { event: 'payment.paid' }
        await updateDonationPaymentDB('ext-123', null, 'pix-123', 'PAID', 80, payload, null, null)

        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO donation_status_history'),
            ['test-uuid', 'PAID', JSON.stringify(payload)]
        )
    })
})
