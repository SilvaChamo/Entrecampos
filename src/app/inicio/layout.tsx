import "../globals.css";
import Footer from "@/components/Layout/Footer";

export default function InicioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
