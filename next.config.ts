import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    domains: ['images.unsplash.com'], // ✅ Correctly placed
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: {
        and: [/\.(js|ts|tsx|jsx)$/],
      },
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
