import "./globals.css";
import HeaderWrapper from "@/components/Layout/HeaderWrapper";
import FooterWrapper from "@/components/Layout/FooterWrapper";

import { AuthProvider } from "@/context/AuthContext";

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
