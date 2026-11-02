'use client';

import { Printer } from 'lucide-react';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      aria-label="Imprimir"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-400 text-white hover:opacity-90"
    >
      <Printer className="h-4 w-4" />
    </button>
  );
}
