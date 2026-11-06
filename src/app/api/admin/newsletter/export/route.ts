import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { listSubscribers } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

/** Descarrega a lista de subscritores: csv (abre no Excel), txt (um e-mail por linha) ou json. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const format = req.nextUrl.searchParams.get('format') || 'csv';
  try {
    const subs = await listSubscribers();
    const day = new Date().toISOString().slice(0, 10);
    const send = (body: string, type: string, ext: string) =>
      new NextResponse(body, { headers: { 'Content-Type': `${type}; charset=utf-8`, 'Content-Disposition': `attachment; filename="newsletter-entrecampos-${day}.${ext}"` } });
    if (format === 'txt') return send(subs.map((s) => `${s.email}\r\n`).join(''), 'text/plain', 'txt');
    if (format === 'json') return send(JSON.stringify(subs.map((s) => ({ email: s.email, subscrito_em: s.created_at })), null, 2), 'application/json', 'json');
    // CSV com ";" e marca UTF-8: abre direitinho no Excel em português.
    const lines = ['email;subscrito_em', ...subs.map((s) => `${s.email};${s.created_at.slice(0, 19).replace('T', ' ')}`)];
    return send('﻿' + lines.join('\r\n') + '\r\n', 'text/csv', 'csv');
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Não foi possível exportar.' }, { status: 502 });
  }
}
