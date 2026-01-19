'use client'

import { useEffect, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  userId: string
  email: string
}

interface Review {
  game_id: string
  score: number
  review_text: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    const token = localStorage.getItem('sessionToken')
    if (token) {
      const decodedToken = jwtDecode<DecodedToken>(token)
      setUser(decodedToken)

      const fetchReviews = async () => {
        try {
          const res = await fetch(
            `http://localhost:3000/reviews/${decodedToken.userId}`
          )
          if (res.ok) {
            const data = await res.json()
            setReviews(data.reviews)
          } else {
            console.error('Failed to fetch reviews')
          }
        } catch (error) {
          console.error('An error occurred while fetching reviews:', error)
        }
      }

      fetchReviews()
    }
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      {user && (
        <div className="mb-8">
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>User ID:</strong> {user.userId}
          </p>
        </div>
      )}
      <h2 className="text-xl font-bold mb-4">My Reviews</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review, index) => (
          <div key={index} className="border p-4 rounded-lg">
            <p>
              <strong>Game ID:</strong> {review.game_id}
            </p>
            <p>
              <strong>Score:</strong> {review.score}
            </p>
            <p>
              <strong>Review:</strong> {review.review_text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
