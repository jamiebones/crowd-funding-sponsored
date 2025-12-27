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
      'pino-pretty': false,
    };

    // Handle problematic modules that don't exist in web/server environments
    config.resolve.alias = {
      ...config.resolve.alias,
      // MetaMask SDK tries to import React Native modules - stub them
      '@react-native-async-storage/async-storage': false,
      // Pino logger optional dependencies
      'pino-pretty': false,
    };

    // Ignore these modules entirely to prevent bundling issues
    config.externals = [
      ...(Array.isArray(config.externals) ? config.externals : config.externals ? [config.externals] : []),
      'pino-pretty',
      'encoding',
      'lokijs',
    ];

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
