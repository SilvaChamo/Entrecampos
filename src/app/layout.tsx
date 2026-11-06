import type { Metadata } from "next";
import "./globals.css";
import RevealOnView from "@/components/Expnews/RevealOnView";
import HitTracker from "@/components/Site/HitTracker";

import { AuthProvider } from "@/context/AuthContext";
import { getCategoryColors } from "@/lib/category-colors";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://entrecamposblog.com').replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'EntreCAMPOS', template: '%s | EntreCAMPOS' },
  description: 'EntreCAMPOS: notícias de agricultura, sector agrário, ambiente e comunidade em Moçambique.',
  openGraph: { type: 'website', locale: 'pt_PT', siteName: 'EntreCAMPOS', url: SITE_URL, images: ['/images/logo.png'] },
  twitter: { card: 'summary_large_image' },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const colors = await getCategoryColors();
  const colorVars = Object.entries(colors)
    .filter(([slug]) => /^[a-z0-9-]+$/.test(slug))
    .map(([slug, color]) => `--cat-${slug}:${color};`)
    .join('');
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <head>
        {/* Abre já a ligação ao Supabase (imagens das notícias e dados) e ao serviço do clima */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />}
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
        {/* Cores das etiquetas de categoria escolhidas no painel */}
        {colorVars && <style dangerouslySetInnerHTML={{ __html: `:root{${colorVars}}` }} />}
      </head>
      <body style={{ fontFamily: 'Verdana, sans-serif' }}>
        <AuthProvider>
          <RevealOnView />
          <HitTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
