import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compresser les responses pour améliorer les performances
  compress: true,

  // Supprimer le header X-Powered-By pour la sécurité
  poweredByHeader: false,

  // Domaines d'images autorisés (Supabase Storage)
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
        hostname: 'lh3.googleusercontent.com', // Avatars Google si OAuth plus tard
      }
    ],
  },

  // Variables d'environnement exposées côté client (en plus des NEXT_PUBLIC_*)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Racines+',
    NEXT_PUBLIC_APP_VERSION: '0.1.0-MVP',
    NEXT_PUBLIC_APP_VILLAGE_PILOTE: 'Toa-Zéo',
  },

  // Désactiver strictement le mode source-maps en production
  productionBrowserSourceMaps: false,

  // Headers de sécurité supplémentaires
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

export default nextConfig;
