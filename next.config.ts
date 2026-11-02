import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite compilar a versão estável noutra pasta, sem tocar na do servidor de desenvolvimento.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'entrecampos.co.mz',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'entrecamposblog.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // Garantir que todas as rotas estáticas sejam geradas
  trailingSlash: false,
};

export default nextConfig;
