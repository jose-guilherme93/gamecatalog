'use client'

import { useState } from 'react'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const res = await fetch(`/games/search-game?title=${query}`, {method: 'POST'})

      if (res.ok) {
        const data = await res.json()
        setResults(data)
      } else {
        const errorData = await res.json()
        console.error('Search failed:', errorData)
      }
    } catch (error) {
      console.error('An error occurred during search:', error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-blue-500"
          placeholder="Search for a game..."
        />
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((game: any) => (
          <div key={game.id} className="border rounded-lg p-4">
            <img src={game.background_image} alt={game.name} className="w-full h-48 object-cover mb-2" />
            <h2 className="text-xl font-bold">{game.name}</h2>
            <p className="text-gray-500">{game.released}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
