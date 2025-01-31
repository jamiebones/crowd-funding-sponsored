import type { NextConfig } from "next";


const nextConfig = {
  webpack: (config: NextConfig) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    domains: ['arweave.net'],
  },
};

export default nextConfig;