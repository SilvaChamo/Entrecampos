import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { comSubscricao, db, loadPedidos, savePedidos, subscricaoDe } from '@/lib/assinaturas';
import { isSiteAccount } from '@/lib/site-accounts';
import { somarMeses, subscricaoActiva, type Subscricao } from '@/lib/assinaturas-types';

const PERMISSIONS = ['editar_definicoes'];

/** Pedidos de subscrição e lista de assinantes (contas com subscrição, activa ou já terminada). */
export async function GET() {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const pedidos = await loadPedidos();
    const assinantes: { id: string; name: string; email: string; sub: Subscricao; active: boolean }[] = [];
    const client = db();
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data) break;
      for (const u of data.users) {
        if (!isSiteAccount(u)) continue;
        const sub = subscricaoDe(u);
        if (sub) assinantes.push({ id: u.id, name: String(u.user_metadata?.full_name || u.email?.split('@')[0] || ''), email: u.email || '', sub, active: subscricaoActiva(sub) });
      }
      if (data.users.length < 1000) break;
    }
    assinantes.sort((a, b) => b.sub.until.localeCompare(a.sub.until));
    return NextResponse.json({ pedidos, assinantes });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao ler as subscrições.' }, { status: 500 });
  }
}

/** `aprovar` / `rejeitar` um pedido (`id`), ou `revogar` a subscrição de um leitor (`userId`). */
export async function POST(req: NextRequest) {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const { action, id, userId, note } = (await req.json()) as { action?: string; id?: string; userId?: string; note?: string };
    const client = db();

    if (action === 'revogar') {
      const { data } = await client.auth.admin.getUserById(String(userId || ''));
      if (!data?.user || !isSiteAccount(data.user)) return NextResponse.json({ error: 'Leitor inexistente.' }, { status: 404 });
      const { error } = await client.auth.admin.updateUserById(data.user.id, { app_metadata: comSubscricao(data.user, null) });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action !== 'aprovar' && action !== 'rejeitar') return NextResponse.json({ error: 'Acção inválida.' }, { status: 400 });
    const pedidos = await loadPedidos();
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return NextResponse.json({ error: 'Pedido inexistente.' }, { status: 404 });
    if (pedido.status !== 'pendente') return NextResponse.json({ error: 'Este pedido já foi tratado.' }, { status: 409 });

    if (action === 'aprovar') {
      const { data } = await client.auth.admin.getUserById(pedido.userId);
      if (!data?.user || !isSiteAccount(data.user)) return NextResponse.json({ error: 'A conta deste leitor já não existe.' }, { status: 404 });
      const actual = subscricaoDe(data.user);
      // renovar antes de acabar soma ao tempo que ainda resta
      const base = actual && subscricaoActiva(actual) ? new Date(actual.until) : new Date();
      const sub: Subscricao = { planId: pedido.planId, planName: pedido.planName, since: actual && subscricaoActiva(actual) ? actual.since : new Date().toISOString(), until: somarMeses(base, pedido.months).toISOString() };
      const { error } = await client.auth.admin.updateUserById(data.user.id, { app_metadata: comSubscricao(data.user, sub) });
      if (error) throw error;
    }

    pedido.status = action === 'aprovar' ? 'aprovado' : 'rejeitado';
    pedido.decidedAt = new Date().toISOString();
    if (action === 'rejeitar' && note) pedido.note = String(note).replace(/<[^>]*>/g, '').trim().slice(0, 200);
    await savePedidos(pedidos);
    return NextResponse.json({ ok: true, pedido });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao tratar o pedido.' }, { status: 500 });
  }
}
