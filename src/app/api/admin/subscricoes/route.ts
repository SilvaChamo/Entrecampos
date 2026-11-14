import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { alterarPedidos, comSubscricao, Conflito, db, loadPedidos, subscricaoDe } from '@/lib/assinaturas';
import { isSiteAccount } from '@/lib/site-accounts';
import { somarMeses, subscricaoActiva, type Pedido, type Subscricao } from '@/lib/assinaturas-types';

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
    // Primeiro reserva a decisão (só um pedido de aprovação passa); depois dá a subscrição. Se isso falhar, devolve o pedido a «pendente».
    let pedido!: Pedido;
    await alterarPedidos((lista) => {
      const p = lista.find((x) => x.id === id);
      if (!p) throw new Conflito('Pedido inexistente.', 404);
      if (p.status !== 'pendente') throw new Conflito('Este pedido já foi tratado.', 409);
      p.status = action === 'aprovar' ? 'aprovado' : 'rejeitado';
      p.decidedAt = new Date().toISOString();
      if (action === 'rejeitar' && note) p.note = String(note).replace(/<[^>]*>/g, '').trim().slice(0, 200);
      pedido = { ...p };
      return lista;
    });

    if (action === 'aprovar') {
      try {
        const { data } = await client.auth.admin.getUserById(pedido.userId);
        if (!data?.user || !isSiteAccount(data.user)) throw new Conflito('A conta deste leitor já não existe.', 404);
        const actual = subscricaoDe(data.user);
        // renovar antes de acabar soma ao tempo que ainda resta
        const base = actual && subscricaoActiva(actual) ? new Date(actual.until) : new Date();
        const sub: Subscricao = { planId: pedido.planId, planName: pedido.planName, since: actual && subscricaoActiva(actual) ? actual.since : new Date().toISOString(), until: somarMeses(base, pedido.months).toISOString() };
        const { error } = await client.auth.admin.updateUserById(data.user.id, { app_metadata: comSubscricao(data.user, sub) });
        if (error) throw error;
      } catch (e) {
        await alterarPedidos((lista) => lista.map((x) => (x.id === id ? (({ decidedAt: _d, ...resto }) => ({ ...resto, status: 'pendente' as const }))(x) : x)));
        throw e;
      }
    }
    return NextResponse.json({ ok: true, pedido });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao tratar o pedido.' }, { status: err instanceof Conflito ? err.status : 500 });
  }
}
