/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'giftcombobd.com'],
    unoptimized: true,
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
}

module.exports = nextConfig
