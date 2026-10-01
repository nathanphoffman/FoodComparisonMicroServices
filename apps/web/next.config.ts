import type { NextConfig } from 'next';

// API_URL points at the C# data API (ASP.NET Core).
// In dev: http://localhost:5050
// In prod: set NEXT_PUBLIC_API_URL env var to the deployed API URL.
// NEXT_PUBLIC_ prefix makes it available in browser bundles.

const nextConfig: NextConfig = {
  // sql.js resolves its .wasm file at runtime via require.resolve, which
  // webpack can't bundle — load it straight from node_modules instead.
  serverExternalPackages: ['sql.js'],
  env: {
    DB_VERSION: 'v205',
  },
};

export default nextConfig;
