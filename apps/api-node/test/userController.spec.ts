import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../src/models/userModel.js', () => ({
  getAllUsersDB: vi.fn(),
  checkUser: vi.fn(),
  createUserDB: vi.fn(),
  deleteUserDB: vi.fn(),
  updateUserDB: vi.fn(),
  getUserByID: vi.fn(),
  getSessionByIdDb: vi.fn(),
}))

import * as userCtrl from '../src/controllers/userController.js'

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('userController', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('getAllUsers returns users with status 200', async () => {
    const { getAllUsersDB } = await import('../src/models/userModel.js') as any
    getAllUsersDB.mockResolvedValue({ rows: [{ id: '1', username: 'u' }] })

    const res = mockRes()
    // call controller
    await userCtrl.getAllUsers({} as any, res)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ users: [{ id: '1', username: 'u' }] })
  })

  it('getUserByIdController returns 404 when user not found', async () => {
    const { getUserByID } = await import('../src/models/userModel.js') as any
    getUserByID.mockResolvedValue({ rows: [] })

    const req: any = { params: { id: 'not-found' } }
    const res = mockRes()
    await userCtrl.getUserByIdController(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
  })
})
