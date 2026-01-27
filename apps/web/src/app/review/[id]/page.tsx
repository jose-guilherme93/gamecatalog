'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { FaStar } from 'react-icons/fa'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  userId: string
  email: string
}

interface Game {
  id: string
  name: string
  background_image: string
}

export default function ReviewPage() {
  const [game, setGame] = useState<Game | null>(null)
  const [reviewScore, setReviewScore] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [user, setUser] = useState<DecodedToken | null>(null)
  const router = useRouter()
  const params = useParams()
  const { id: gameId } = params

  useEffect(() => {
    const token = localStorage.getItem('sessionToken')
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token)
        setUser(decodedToken)
      } catch (error) {
        console.error('Invalid token:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }

    const savedGame = localStorage.getItem('gameToReview')
    if (savedGame) {
      const parsedGame = JSON.parse(savedGame)
      if (parsedGame.id.toString() === gameId) {
        setGame(parsedGame)
      } else {
        // Handle case where the game in storage doesn't match the URL
        // Maybe fetch the game details from the API
        console.warn('Game in storage does not match the game ID in the URL.')
        // router.push('/profile')
      }
    }
  }, [router, gameId])

  const handleReviewSubmit = async () => {
    if (!user || !game || reviewScore === 0) {
      alert('Please provide a score.')
      return
    }

    try {
      const token = localStorage.getItem('sessionToken')
      const res = await fetch('http://localhost:3000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.userId,
          gameId: game.id,
          score: reviewScore,
          reviewText: reviewText,
        }),
      })

      if (res.ok) {
        alert('Review submitted successfully!')
        localStorage.removeItem('gameToReview')
        router.push('/profile')
      } else {
        const errorData = await res.json()
        alert(`Failed to submit review: ${errorData.message || res.statusText}`)
      }
    } catch (error) {
      console.error('An error occurred while submitting review:', error)
      alert('An error occurred while submitting review.')
    }
  }

  if (!game) {
    return <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4">Review: {game.name}</h1>
          <Image src={game.background_image} width={300} height={180} alt={game.name} className="rounded-md mb-6" />

          <div className="mb-6">
            <label htmlFor="reviewScore" className="block text-lg font-medium text-gray-300 mb-2">Your Score</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`cursor-pointer text-3xl ${reviewScore >= star ? 'text-yellow-400' : 'text-gray-500'}`}
                  onClick={() => setReviewScore(star)}
                />
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="reviewText" className="block text-lg font-medium text-gray-300 mb-2">Your Review</label>
            <textarea
              id="reviewText"
              rows={6}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your thoughts on the game..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="py-2 px-6 bg-gray-600 rounded-md hover:bg-gray-500 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleReviewSubmit}
              className="py-2 px-6 bg-blue-600 rounded-md hover:bg-blue-700 transition font-semibold"
            >
              Submit Review
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
