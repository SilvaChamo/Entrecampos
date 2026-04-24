'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registar o erro silenciosamente
    console.error("Erro capturado pela proteção de sistema:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg max-w-md w-full p-6 text-center animate-in zoom-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl font-bold text-[#1d2327] mb-2">Ops! Ocorreu um pequeno tropeço.</h2>
        
        <p className="text-[#50575e] text-sm mb-6">
          Não se preocupe! As alterações que já fez foram guardadas de forma segura. Apenas ocorreu um erro visual ao processar o próximo passo.
        </p>
        
        <div className="bg-[#f6f7f7] p-3 rounded border border-[#ccd0d4] text-left mb-6 overflow-hidden">
          <p className="text-[11px] font-bold text-[#50575e] mb-1">Detalhe técnico para a equipa:</p>
          <p className="text-[10px] text-red-500 font-mono break-words">{error.message}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/admin/noticias'}
            className="flex-1 px-4 py-2.5 border border-[#ccd0d4] text-[#50575e] rounded text-sm font-bold hover:bg-[#f6f7f7] transition-colors"
          >
            Voltar
          </button>
          
          <button
            onClick={
              // Tentativa de recuperar a renderização da página
              () => reset()
            }
            className="flex-[2] flex items-center justify-center gap-2 bg-[#2271b1] text-white py-2.5 rounded text-sm font-bold hover:bg-[#135e96] shadow-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Recuperar Página
          </button>
        </div>
      </div>
    </div>
  );
}
