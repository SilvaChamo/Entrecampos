"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();
  
  // Não renderizar Header na página /inicio
  if (pathname === "/inicio") {
    return null;
  }
  
  return <Header />;
}
