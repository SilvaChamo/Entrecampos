'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import Spinner from '@/components/Common/Spinner';

/** Regresso do Google: o Supabase troca o código pela sessão e o servidor abre a sessão do EntreCAMPOS. */
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data, error: sessionError } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (sessionError || !token) throw new Error('Não foi possível concluir a entrada com o Google.');
        const res = await fetch('/api/auth/oauth', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: token }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        await supabase.auth.signOut({ scope: 'local' }); // a sessão do site é o cookie próprio; a do Supabase não é precisa
        if (!res.ok) throw new Error(body.error || 'Não foi possível entrar.');
        window.location.replace('/admin'); // carrega de novo para o site ler a sessão
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl border border-[#ccd0d4] p-8 text-center space-y-4">
        {error ? (
          <>
            <p className="text-sm text-red-700">{error}</p>
            <Link href="/login" className="inline-block px-5 py-2 bg-[#2271b1] text-white font-bold hover:bg-[#135e96]">Voltar ao login</Link>
          </>
        ) : (
          <>
            <Spinner size={32} className=" mx-auto" />
            <p className="text-sm text-gray-500">A concluir a entrada…</p>
          </>
        )}
      </div>
    </div>
  );
}
