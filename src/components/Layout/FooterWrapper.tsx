"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Footer em páginas de admin
  if (pathname === "/" || pathname === "/noticias" || pathname.startsWith("/noticias/") || pathname.startsWith("/categoria/") || pathname.startsWith("/pagina/") || pathname === "/iniciar" || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }
  
  return <Footer />;
}
