/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add rewrites to handle static file serving
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/images/:path*',
      },
    ]
  },
}

export default nextConfig
