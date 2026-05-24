import type { NextConfig } from 'next';

// API_URL points at the C# data API (ASP.NET Core).
// In dev: http://localhost:5000
// In prod: set NEXT_PUBLIC_API_URL env var to the deployed API URL.
// NEXT_PUBLIC_ prefix makes it available in browser bundles.

const nextConfig: NextConfig = {
  env: {
    DB_VERSION: 'v88',
  },
  webpack(config) {
    // Required for importing .wasm files from the wasm-calculations package.
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
