import "./globals.css";
import HeaderWrapper from "@/components/Layout/HeaderWrapper";
import Footer from "@/components/Layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: 'Verdana, sans-serif' }}>
        <HeaderWrapper />
        {children}
        <Footer />
      </body>
    </html>
  );
}
