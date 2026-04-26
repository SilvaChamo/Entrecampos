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
  // Garantir que todas as rotas estáticas sejam geradas
  trailingSlash: false,
};

export default nextConfig;
