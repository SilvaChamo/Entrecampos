import "../globals.css";
import HeaderOld from "@/components/Layout/HeaderOld";
import Footer from "@/components/Layout/Footer";

export default function InicioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <HeaderOld />
      {children}
      <Footer />
    </>
  );
}
