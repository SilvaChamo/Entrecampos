import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'entrecampos.co.mz',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
