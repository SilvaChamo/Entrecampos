import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: 'Verdana, sans-serif' }}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
