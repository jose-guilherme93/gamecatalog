/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*',
      },
      {
        source: '/users/:path*',
        destination: 'http://localhost:3000/users/:path*',
      },
      {
        source: '/games/:path*',
        destination: 'http://localhost:3000/games/:path*',
      },
      {
        source: '/reviews/:path*',
        destination: 'http://localhost:3000/reviews/:path*',
      },
      {
        source: '/payment/:path*',
        destination: 'http://localhost:3000/payment/:path*',
      },
    ]
  },
}

module.exports = nextConfig
