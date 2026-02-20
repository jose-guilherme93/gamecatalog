'use client'

import { useEffect, useState, useRef } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { FaSearch, FaStar, FaUserCircle } from 'react-icons/fa'
import axios from 'axios'

interface DecodedToken {
  userId: string
  email: string
}

interface Review {
  game_id: string
  score: number
  review_text: string
  game: {
    title: string
    background_image: string
  }
}

interface Game {
  id: string
  name: string
  background_image: string
  description: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
    }
    const token = getCookie('sessionToken')
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token)
        setUser(decodedToken)
        fetchReviews(decodedToken.userId)
      } catch (error) {
        console.error('Invalid token:', error)
        handleLogout()
      }
    } else {
      router.push('/login')
    }

    const savedQuery = localStorage.getItem('searchQuery')
    if (savedQuery) {
      setSearchQuery(savedQuery)
    }
  }, [router])

  useEffect(() => {
    localStorage.setItem('searchQuery', searchQuery)
  }, [searchQuery])

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

  const fetchReviews = async (userId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/reviews/user/${userId}`)
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

  const handleLogout = () => {
    document.cookie = 'sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    localStorage.removeItem('searchQuery')
    router.push('/login')
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery) return

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`http://localhost:3000/games/search-game?title=${searchQuery}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data)
        setSelectedGame(null)
      } else {
        setError('Failed to fetch games')
        setSearchResults([])
      }
    } catch (error) {
      setError('An error occurred while searching for games')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGameSelect = async (game: Game) => {
    try {
      // Replace with your actual RAWG API key
      const apiKey = process.env.NEXT_PUBLIC_RAWG_KEY
      const response = await axios.get(`https://api.rawg.io/api/games/${game.id}?key=${apiKey}`)
      const gameDetails = response.data

      const gameData = {
        game_id: gameDetails.id.toString(),
        title: gameDetails.name,
        slug: gameDetails.slug,
        rating: gameDetails.rating,
        status: 'Jogando', // Default status
        review: '', // Default review
        storyline: gameDetails.description_raw,
        cover_url: gameDetails.background_image,
        plataform: gameDetails.platforms.map((p: any) => p.platform.name).join(', '),
        first_release_date: gameDetails.released,
      }
      console.log(gameData)
      await fetch('http://localhost:3000/games/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      })
      

      localStorage.setItem('gameToReview', JSON.stringify(game))
      router.push(`/review/${game.id}`)
    } catch (error) {
      console.error('Error fetching game details or saving game:', error)
     
    }
  }

  const handleReviewSubmit = async () => {
    if (!user || !selectedGame || reviewScore === 0) {
      alert('Please select a game and provide a score.')
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
          gameId: selectedGame.id,
          score: reviewScore,
          reviewText: reviewText,
        }),
      })

      if (res.ok) {
        alert('Review submitted successfully!')
        setSelectedGame(null)
        setReviewScore(0)
        setReviewText('')
        if (user) {
          fetchReviews(user.userId)
        }
      } else {
        const errorData = await res.json()
        alert(`Failed to submit review: ${errorData.message || res.statusText}`)
      }
    } catch (error) {
      console.error('An error occurred while submitting review:', error)
      alert('An error occurred while submitting review.')
    }
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold hover:bg-gray-600 transition"
              aria-label="User menu"
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : <FaUserCircle />}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {user && (
          <div className="mb-8 p-6 bg-gray-800 rounded-lg shadow-lg">
            <p className="text-lg"><strong>Email:</strong> {user.email}</p>
            <p className="text-lg"><strong>User ID:</strong> {user.userId}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Add Review */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Add a New Review</h2>
            
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search for a game to review..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" disabled={isLoading}>
                  <FaSearch />
                </button>
              </div>
            </form>

            {isLoading && <p>Searching...</p>}
            {error && <p className="text-red-500">{error}</p>}
            
            {searchResults.length > 0 && (
              <ul className="bg-gray-700 rounded-md max-h-60 overflow-y-auto mt-2">
                {searchResults.map((game) => (
                  <li
                    key={game.id}
                    className="p-3 hover:bg-gray-600 cursor-pointer flex items-center gap-4"
                    onClick={() => handleGameSelect(game)}
                  >
                    <Image src={game.background_image} width={50} height={50} alt={game.name} className="rounded" />
                    <span>{game.name}</span>
                  </li>
                ))}
              </ul>
            )}

            {selectedGame && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-3">Reviewing: {selectedGame.name}</h3>
                <Image src={selectedGame.background_image} width={200} height={120} alt={selectedGame.name} className="rounded-md mb-4" />

                <div className="mb-4">
                  <label htmlFor="reviewScore" className="block text-sm font-medium text-gray-300 mb-1">Score (1-5)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`cursor-pointer ${reviewScore >= star ? 'text-yellow-400' : 'text-gray-500'}`}
                        onClick={() => setReviewScore(star)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="reviewText" className="block text-sm font-medium text-gray-300 mb-1">Review</label>
                  <textarea
                    id="reviewText"
                    rows={4}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What did you think of the game?"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                  ></textarea>
                </div>

                <button
                  onClick={handleReviewSubmit}
                  className="w-full py-2 px-4 bg-blue-600 rounded-md hover:bg-blue-700 transition font-semibold"
                >
                  Submit Review
                </button>
              </div>
            )}
          </div>

          {/* Right Column: My Reviews */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">My Reviews</h2>
            {reviews.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {reviews.map((review, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-md flex items-start gap-4">
                    <Image src={review.game.background_image} width={80} height={80} alt={review.game.title} className="rounded-md object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{review.game.title}</h4>
                      <div className="flex items-center my-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < review.score ? 'text-yellow-400' : 'text-gray-500'} />
                        ))}
                        <span className="ml-2 text-sm text-gray-400">({review.score}/5)</span>
                      </div>
                      <p className="text-gray-300">{review.review_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">You haven't written any reviews yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
