import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      }
    ],
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [32, 48, 64, 96, 128, 256],
    formats: ['image/avif', 'image/webp'],
  },

  env: {
    NEXT_PUBLIC_APP_NAME: 'Racines+',
    NEXT_PUBLIC_APP_VERSION: '0.1.0-MVP',
    NEXT_PUBLIC_APP_VILLAGE_PILOTE: 'Toa-Zéo',
  },

  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

const sentryConfig = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? require('@sentry/nextjs').withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG || 'racines-plus',
      project: process.env.SENTRY_PROJECT || 'racines-plus',
      silent: true,
    } as import('@sentry/nextjs').SentryBuildOptions)
  : nextConfig;

export default sentryConfig;
