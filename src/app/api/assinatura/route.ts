import { NextRequest, NextResponse } from 'next/server';
import { alterarPedidos, Conflito, db, leitorActual, loadExclusivas, loadPedidos, loadPlanos, subscricaoDe } from '@/lib/assinaturas';
import { getAllPosts } from '@/lib/news-data';
import { subscricaoActiva, type Exclusiva, type Pedido } from '@/lib/assinaturas-types';
import { tooManyAttempts } from '@/lib/rate-limit';
import { isUuid } from '@/lib/api-guard';

const SEM_SESSAO = NextResponse.json({ error: 'Inicie sessão para continuar.' }, { status: 401 });

/** Estado da subscrição de quem está com sessão: plano, pedido em curso, planos à venda e últimas exclusivas. */
export async function GET() {
  const session = await leitorActual();
  if (!session) return SEM_SESSAO;
  try {
    const [{ data }, config, pedidos, slugs, { posts }] = await Promise.all([(isUuid(session.id) ? db().auth.admin.getUserById(session.id) : Promise.resolve({ data: { user: null } })), loadPlanos(), loadPedidos(), loadExclusivas(), getAllPosts()]);
    const sub = subscricaoDe(data?.user);
    const meus = pedidos.filter((p) => p.userId === session.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const exclusivas: Exclusiva[] = posts.filter((p) => slugs.includes(p.slug)).slice(0, 12).map((p) => ({ slug: p.slug, title: p.title, date: p.date, category: p.category }));
    return NextResponse.json({
      user: { name: session.name, email: session.email, role: session.role },
      subscription: sub ? { ...sub, active: subscricaoActiva(sub) } : null,
      pedido: meus[0] ?? null,
      plans: config.plans.filter((p) => p.active),
      payment: config.payment,
      exclusivas,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao ler a subscrição.' }, { status: 500 });
  }
}

/** Pedido de subscrição: o leitor escolhe o plano, paga fora do site e indica a referência; a redacção confirma. */
export async function POST(req: NextRequest) {
  const session = await leitorActual();
  if (!session) return SEM_SESSAO;
  if (tooManyAttempts(`pedido|${session.id}`, 5, 60 * 60 * 1000)) return NextResponse.json({ error: 'Demasiados pedidos. Tente mais tarde.' }, { status: 429 });
  try {
    const body = (await req.json()) as { planId?: unknown; reference?: unknown };
    const reference = String(body.reference ?? '').replace(/<[^>]*>/g, '').trim().slice(0, 80);
    if (reference.length < 3) return NextResponse.json({ error: 'Indique a referência do pagamento (por exemplo, o código da transacção M-Pesa).' }, { status: 400 });

    const config = await loadPlanos();
    const plano = config.plans.find((p) => p.id === String(body.planId) && p.active);
    if (!plano) return NextResponse.json({ error: 'Plano inexistente.' }, { status: 400 });
    if (plano.price == null) return NextResponse.json({ error: 'Este plano ainda não está disponível.' }, { status: 400 });

    const novo: Pedido = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      userId: session.id,
      email: session.email,
      name: session.name,
      planId: plano.id,
      planName: plano.name,
      price: plano.price,
      months: plano.months,
      reference,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    await alterarPedidos((lista) => {
      if (lista.some((p) => p.userId === session.id && p.status === 'pendente')) throw new Conflito('Já tem um pedido a aguardar confirmação.', 409);
      return [novo, ...lista].slice(0, 2000);
    });
    return NextResponse.json({ ok: true, pedido: novo });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Não foi possível enviar o pedido.' }, { status: err instanceof Conflito ? err.status : 500 });
  }
}
