import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  cacheComponents: true,
  partialPrefetching: true,

  outputFileTracingIncludes: {
    '/api/card': ['./src/app/api/card/assets/**/*'],

    '/api/talisman': ['./public/media/talisman/**/*'],

    '/api/reading': ['./prompts/**/*.md'],

    '/api/chat': ['./prompts/**/*.md'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
