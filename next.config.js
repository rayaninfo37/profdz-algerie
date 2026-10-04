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
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      // Static assets: max cache, immutable
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // Security headers applied to ALL routes
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },

      // API routes: zero caching, prevent CDN from serving stale auth responses
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, max-age=0, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },

      // Dynamic pages: tell Netlify CDN not to cache, vary by cookie for auth
      {
        source: '/(|teachers|products|feed|ranking|library|dashboard/:path*|admin|admin/:path*|institutions/:path*|students/:path*|parents/:path*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, max-age=0, must-revalidate' },
          { key: 'Netlify-Vary', value: 'Cookie' },
        ],
      },
    ];
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
