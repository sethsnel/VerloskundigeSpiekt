/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { hostname: 'lh3.googleusercontent.com' },
      { hostname: 'firebasestorage.googleapis.com' },
      { hostname: 'googleusercontent.com' },
    ]
  },
  devIndicators: {
    appIsrStatus: false,
  },
}

module.exports = nextConfig
