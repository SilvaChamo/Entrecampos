import { NextResponse } from 'next/server';
import { runDueSchedules } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * Disparo de reserva dos envios agendados da newsletter: o site e o painel chamam esta rota ao abrir uma página, e os
 * horários cuja hora já chegou são enviados. Não leva dados nem credenciais (só envia o que o painel já agendou) e
 * responde sempre o mesmo. Há um limite de uma verificação por minuto em cada instância.
 */
let lastCheck = 0;
async function pulse() {
  // Só em produção: o servidor local usa a base e o SMTP reais e enviaria e-mails a sério.
  if (process.env.NODE_ENV === 'production' && Date.now() - lastCheck >= 60_000) {
    lastCheck = Date.now();
    try {
      await runDueSchedules();
    } catch (e) {
      console.error('[newsletter] pulso falhou:', e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ ok: true });
}

export const GET = pulse;
export const POST = pulse;
