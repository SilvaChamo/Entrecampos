"use client";

import { usePathname } from "next/navigation";
import HeaderOld from "./HeaderOld";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Header em páginas que já têm header próprio:
  // / (home - tem SimpleHeader executivo)
  // /inicio (tem HeaderOld no próprio layout)
  // /admin (painel administrativo)
  if (pathname === "/" || pathname === "/inicio" || pathname.startsWith("/admin")) {
    return null;
  }
  
  // Usar HeaderOld como header principal em todas as outras páginas
  return <HeaderOld />;
}
