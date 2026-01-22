/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 1. Configuração de Imagens (RAWG)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.rawg.io',
        port: '',
        pathname: '/media/**',
      },
    ],
  },

  // 2. Configuração de Proxy (Rewrites)
  async rewrites() {
    return [
      {
        /*
         * Captura qualquer requisição para /api/:path* no seu frontend (porta 3002)
         * e redireciona silenciosamente para o seu backend Node.js (porta 3000).
         */
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
      // Se você tiver rotas específicas que não começam com /api, adicione-as:
      {
        source: '/auth/:path*',
        destination: 'http://localhost:3000/auth/:path*',
      },
      {
        source: '/games/:path*',
        destination: 'http://localhost:3000/games/:path*',
      },
    ]
  },
}

export default nextConfig