"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Header na página /inicio ou em qualquer página de /admin
  if (pathname === "/inicio" || pathname.startsWith("/admin")) {
    return null;
  }
  
  return <Header />;
}
