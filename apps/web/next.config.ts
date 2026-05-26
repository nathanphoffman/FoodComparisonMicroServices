import type { NextConfig } from 'next';

// API_URL points at the C# data API (ASP.NET Core).
// In dev: http://localhost:5000
// In prod: set NEXT_PUBLIC_API_URL env var to the deployed API URL.
// NEXT_PUBLIC_ prefix makes it available in browser bundles.

const nextConfig: NextConfig = {
  env: {
    DB_VERSION: 'v106',
  },
  webpack(config) {
    // wasm-pack --target web uses `new URL('*.wasm', import.meta.url)` which
    // webpack 5 handles natively as a static asset — no asyncWebAssembly experiment needed.
    return config;
  },
};

export default nextConfig;
