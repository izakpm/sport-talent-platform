import type { NextConfig } from "next";

const configuredBackend = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
if (process.env.VERCEL && !configuredBackend) {
  throw new Error('Set BACKEND_URL to the deployed NestJS API origin in Vercel before building.');
}
const backendUrl = (configuredBackend || 'http://localhost:3001').replace(/\/$/, '');
const backendOrigin = new URL(backendUrl);
if (!['http:', 'https:'].includes(backendOrigin.protocol) || backendOrigin.username || backendOrigin.password || backendOrigin.search || backendOrigin.hash || backendOrigin.pathname !== '/') {
  throw new Error('BACKEND_URL must be an HTTP(S) origin without credentials, a path, query, or fragment.');
}
if (process.env.VERCEL && (backendOrigin.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(backendOrigin.hostname))) {
  throw new Error('Vercel requires a public HTTPS BACKEND_URL, not localhost.');
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/activities', destination: '/dashboard/athlete/activities', permanent: false },
      { source: '/sports', destination: '/dashboard/athlete/sports', permanent: false },
      { source: '/dashboard/athletes', destination: '/dashboard/athlete', permanent: false },
      { source: '/dashboard/athletes/:path*', destination: '/dashboard/athlete/:path*', permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${backendUrl}/:path*` },
      { source: '/auth/:path*', destination: `${backendUrl}/auth/:path*` },
      { source: '/users/:path*', destination: `${backendUrl}/users/:path*` },
      { source: '/sports/:path*', destination: `${backendUrl}/sports/:path*` },
      { source: '/positions/:path*', destination: `${backendUrl}/positions/:path*` },
    ];
  },
};

export default nextConfig;
