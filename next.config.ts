// next.config.ts (agar aap TypeScript use kar rahe hain)
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    // SVG files ke liye SVGR loader add kar rahe hain
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
