'use client'

import { useEffect, useState, useRef } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface DecodedToken {
  userId: string
  email: string
}

interface Review {
  game_id: string
  score: number
  review_text: string
}

interface Game {
  id: string
  title: string
  description: string
  // Add other relevant game fields here
}

export default function ProfilePage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [reviewScore, setReviewScore] = useState(0)
  const [reviewText, setReviewText] = useState('')

  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    } else {
      router.push('/login') // Redirect to login if no session token
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('sessionToken')
    router.push('/login')
  }

  const handleSearch = async () => {
    if (!searchQuery) return
    try {
      const res = await fetch(`http://localhost:3000/games/search-game?title=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
        setSelectedGame(null) // Clear selected game when new search is made
      } else {
        console.error('Failed to fetch games')
        setSearchResults([])
      }
    } catch (error) {
      console.error('An error occurred while searching for games:', error)
      setSearchResults([])
    }
  }

  const handleGameSelect = async (gameId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/games/${gameId}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedGame(data)
        setReviewScore(0)
        setReviewText('')
      } else {
        console.error('Failed to fetch game details')
        setSelectedGame(null)
      }
    } catch (error) {
      console.error('An error occurred while fetching game details:', error)
      setSelectedGame(null)
    }
  }

  const handleReviewSubmit = async () => {
    if (!user || !selectedGame || reviewScore === 0) {
      alert('Please select a game and provide a score.')
      return
    }

    try {
      const token = localStorage.getItem('sessionToken');
      const res = await fetch('http://localhost:3000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.userId,
          gameId: selectedGame.id,
          score: reviewScore,
          reviewText: reviewText,
        }),
      })

      if (res.ok) {
        alert('Review submitted successfully!')
        // Optionally, refresh reviews list or clear form
        setReviewScore(0)
        setReviewText('')
        setSelectedGame(null)
        setSearchQuery('')
        setSearchResults([])
        // Re-fetch user reviews to show the new one
        if (user) {
          const fetchReviews = async () => {
            const reviewsRes = await fetch(
              `http://localhost:3000/reviews/${user.userId}`
            )
            if (reviewsRes.ok) {
              const data = await reviewsRes.json()
              setReviews(data.reviews)
            }
          }
          fetchReviews()
        }
      } else {
        const errorData = await res.json();
        alert(`Failed to submit review: ${errorData.message || res.statusText}`)
      }
    } catch (error) {
      console.error('An error occurred while submitting review:', error)
      alert('An error occurred while submitting review.')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold"
            aria-label="User Avatar"
          >
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
              <button
                onClick={handleLogout}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

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

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl text-black font-bold mb-4">Search Games & Add Review</h2>
        <div className="flex mb-4">
          <input
            type="text"
            className="flex-1 p-2 border text-black border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-4 text-black">
            <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
            <ul>
              {searchResults.map((game) => (
                <li
                  key={game.id}
                  className="p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                 // onClick={() => handleGameSelect(game.id)}
                >
                  
                  <span>{game.title}</span>
                  <Image src={game?.cover_url ?? ''} width={100} height={120} alt="" />
                  <button className="text-blue-500 hover:underline">Select</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedGame && (
          <div className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Selected Game: {selectedGame.title}</h3>
            <p className="text-gray-700 mb-4">{selectedGame.description}</p>

            <h4 className="text-md font-semibold mb-2">Submit Your Review</h4>
            <div className="mb-2">
              <label htmlFor="reviewScore" className="block text-sm font-medium text-gray-700">Score (1-5):</label>
              <input
                type="number"
                id="reviewScore"
                min="1"
                max="5"
                className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={reviewScore}
                onChange={(e) => setReviewScore(parseInt(e.target.value))}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700">Review Text:</label>
              <textarea
                id="reviewText"
                rows={4}
                className="mt-1 p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your review here..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>
            </div>
            <button
              onClick={handleReviewSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Submit Review
            </button>
          </div>
        )}
      </div>

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
