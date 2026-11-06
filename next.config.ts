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
  compress: true,
  poweredByHeader: false,
  // /webmail abre o Roundcube do servidor de e-mail (o site está na Vercel, não no servidor onde está o webmail)
  async redirects() {
    return [
      { source: '/webmail/:path*', destination: 'https://webmail.entrecamposblog.com/', permanent: false },
      { source: '/roundcube/:path*', destination: 'https://webmail.entrecamposblog.com/', permanent: false },
    ];
  },
  // Ficheiros estáticos do site ficam 7 dias no navegador; o painel e a API nunca vão para cache.
  async headers() {
    return [
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }] },
      { source: '/:file(favicon.ico|icon.png|apple-icon.png)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ];
  },
};

export default nextConfig;
