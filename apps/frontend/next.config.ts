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
  webpack: (config) => {
    // Ignore React Native and Node.js-specific modules that wagmi/RainbowKit dependencies try to import
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
      'lokijs': false,
      'encoding': false,
    };

    // Suppress specific warnings
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /pino/ },
      { module: /@walletconnect/ },
    ];

    return config;
  },
};

export default nextConfig;
