import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arweave.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude problematic node_modules packages from bundling
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'pino-pretty': 'pino-pretty',
        'encoding': 'encoding',
      });
    }

    // Exclude test files and non-JS files from being processed
    config.module.rules.push({
      test: /node_modules[\/\\]thread-stream[\/\\](test|bench\.js)/,
      use: 'ignore-loader',
    });

    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Add polyfills for browser-only APIs in server-side builds
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }

    return config;
  },
  // Exclude specific pages from static generation if they have issues
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
