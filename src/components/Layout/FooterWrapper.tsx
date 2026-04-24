"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Footer em páginas de admin
  if (pathname.startsWith("/admin")) {
    return null;
  }
  
  return <Footer />;
}
