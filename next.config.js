/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'ui-avatars.com'],
  },
  // 禁用静态优化以确保API路由正常工作
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
  // 确保API路由不被缓存
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig