/** @type {import('next').NextConfig} */
const path = require('path');
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/discover',
        destination: '/teachers',
        permanent: true,
      },
      {
        source: '/focus',
        destination: '/ranking',
        permanent: true,
      },
      {
        source: '/library',
        destination: '/products',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
