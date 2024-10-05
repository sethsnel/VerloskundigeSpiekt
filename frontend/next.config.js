/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'firebasestorage.googleapis.com', 'googleusercontent.com'],
  },
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig
