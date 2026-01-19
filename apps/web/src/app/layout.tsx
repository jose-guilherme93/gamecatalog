import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Game Catalog',
  description: 'A catalog of games',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 p-4">
          <div className="container mx-auto flex justify-between">
            <Link href="/" className="text-white font-bold">
              Game Catalog
            </Link>
            <div>
              <Link href="/search" className="text-gray-300 hover:text-white mr-4">
                Search
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white mr-4">
                Profile
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white mr-4">
                Login
              </Link>
              <Link href="/recovery" className="text-gray-300 hover:text-white">
                Forgot Password
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
