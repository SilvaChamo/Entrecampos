import "./globals.css";
import HeaderWrapper from "@/components/Layout/HeaderWrapper";
import FooterWrapper from "@/components/Layout/FooterWrapper";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  icons: {
    icon: 'https://ppgmtxzuaxqshipnvebl.supabase.co/storage/v1/object/public/news-images/1777138425814-cropped-CIMBOLO-100.jpg',
    shortcut: 'https://ppgmtxzuaxqshipnvebl.supabase.co/storage/v1/object/public/news-images/1777138425814-cropped-CIMBOLO-100.jpg',
    apple: 'https://ppgmtxzuaxqshipnvebl.supabase.co/storage/v1/object/public/news-images/1777138425814-cropped-CIMBOLO-100.jpg',
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
