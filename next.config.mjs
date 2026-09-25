/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'nlds-obt-points.vercel.app',
      ],
    },
  },
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
