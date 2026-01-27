'use client'

import { useState } from 'react'
import { FaSearch, FaPlaystation, FaXbox, FaWindows, FaApple, FaAndroid, FaLinux } from 'react-icons/fa'

const platformIcons: any = {
  'PlayStation': <FaPlaystation />,
  'Xbox': <FaXbox />,
  'PC': <FaWindows />,
  'iOS': <FaApple />,
  'Android': <FaAndroid />,
  'Linux': <FaLinux />
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`http://localhost:3000/games/search-game?title=${query}`, { method: 'POST' })

      if (res.ok) {
        const data = await res.json()
        setResults(data)
      } else {
        const errorData = await res.json()
        setError(errorData.message || 'Search failed')
        setResults([])
      }
    } catch (error) {
      setError('An error occurred during search')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-700 rounded-lg text-lg bg-gray-800 text-white focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Search for a game..."
            aria-label="Search for a game"
          />
          <button
            type="submit"
            className="absolute right-0 top-0 mt-3 mr-4 text-gray-400 hover:text-white"
            aria-label="Submit search"
            disabled={isLoading}
          >
            <FaSearch size={24} />
          </button>
        </div>
      </form>

      {isLoading && <p className="text-center text-lg">Loading...</p>}
      {error && <p className="text-center text-red-500 text-lg">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((game) => (
          <div key={game.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <img src={game.background_image} alt={`Cover art for ${game.name}`} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h2 className="text-2xl font-bold mb-2 text-white">{game.name}</h2>
              <div className="flex items-center mb-3">
                <span className="text-yellow-400 font-semibold">{game.rating}</span>
                <span className="text-gray-400 ml-2">({game.ratings_count} ratings)</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {game.parent_platforms?.map((p: any) => (
                  <span key={p.platform.id} className="text-gray-400 text-xl">
                    {platformIcons[p.platform.name]}
                  </span>
                ))}
              </div>
              <p className="text-gray-400 mb-4">Released: {new Date(game.released).toLocaleDateString()}</p>
              <button className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                View More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
