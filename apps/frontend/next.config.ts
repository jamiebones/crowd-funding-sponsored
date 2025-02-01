import type { NextConfig } from "next";


const nextConfig = {
  webpack: (config: NextConfig) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    domains: ['arweave.net'],
  },
};

export default nextConfig;