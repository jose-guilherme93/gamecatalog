'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      console.error('No recovery token found')
      return
    }

    try {
      const res = await fetch(
        `/auth/reset-password?recoveryToken=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPasswordHash: password }),
        }
      )

      if (res.ok) {
        const data = await res.json()
        console.log('Password reset successful:', data)
        // Redirect user to login page
      } else {
        const errorData = await res.json()
        console.error('Password reset failed:', errorData)
      }
    } catch (error) {
      console.error('An error occurred during password reset:', error)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-white rounded-lg shadow-md w-96"
      >
        <h1 className="text-2xl font-bold mb-4 text-black">
          Reset Password
        </h1>
        <p className='text-black'>Token: {token}</p>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Reset Password
        </button>
      </form>
    </div>
  )
}
