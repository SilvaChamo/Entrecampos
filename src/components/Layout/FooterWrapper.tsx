"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Footer em páginas de admin
  if (pathname === "/" || pathname.startsWith("/noticias/") || pathname === "/iniciar" || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }
  
  return <Footer />;
}
