import "./globals.css";
import RevealOnView from "@/components/Expnews/RevealOnView";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: 'EntreCAMPOS',
  description: 'Jornal EntreCAMPOS',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <head>
        {/* Abre já a ligação ao Supabase (imagens das notícias e dados) e ao serviço do clima */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />}
        <link rel="dns-prefetch" href="https://api.open-meteo.com" />
      </head>
      <body style={{ fontFamily: 'Verdana, sans-serif' }}>
        <AuthProvider>
          <RevealOnView />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
