import "./globals.css";
import HeaderWrapper from "@/components/Layout/HeaderWrapper";
import FooterWrapper from "@/components/Layout/FooterWrapper";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: 'EntreCAMPOS',
  description: 'Jornal EntreCAMPOS',
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" data-scroll-behavior="smooth">
      <body style={{ fontFamily: 'Verdana, sans-serif' }}>
        <AuthProvider>
          <HeaderWrapper />
          {children}
          <FooterWrapper />
        </AuthProvider>
      </body>
    </html>
  );
}
