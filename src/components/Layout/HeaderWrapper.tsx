"use client";

import { usePathname } from "next/navigation";
import HeaderOld from "./HeaderOld";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Header em páginas que já têm header próprio:
  // / (home - tem SimpleHeader executivo)
  // /inicio (tem HeaderOld no próprio layout)
  // /categorias (tem HeaderOld na própria página)
  // /admin (painel administrativo)
  if (pathname === "/" || pathname === "/noticias" || pathname.startsWith("/noticias/") || pathname.startsWith("/categoria/") || pathname.startsWith("/pagina/") || pathname === "/iniciar" || pathname === "/categorias" || pathname === "/executiva" || pathname === "/inicio" || pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }
  
  // Usar HeaderOld como header principal em todas as outras páginas
  return <HeaderOld />;
}
