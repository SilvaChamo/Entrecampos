import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { addSchedule, loadSchedules, removeSchedule, runSchedule, updateSchedule } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const future = (value: unknown) => {
  const at = new Date(String(value ?? ''));
  return Number.isNaN(at.getTime()) || at.getTime() <= Date.now() ? null : at.toISOString();
};
const fail = (err: unknown, fallback: string) => NextResponse.json({ error: err instanceof Error ? err.message : fallback }, { status: 502 });

/** Horários de envio ainda por enviar (para escolher a que envio anexar uma notícia). */
export async function GET() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  try {
    const pending = (await loadSchedules()).filter((s) => s.status === 'pending').sort((a, b) => a.at.localeCompare(b.at));
    return NextResponse.json({ schedules: pending.map((s) => ({ id: s.id, name: s.name, at: s.at, slugs: s.slugs })) });
  } catch (err) {
    return fail(err, 'Não foi possível carregar os agendamentos.');
  }
}

/** Cria um horário de envio (pode ficar sem notícias; juntam-se depois a partir da lista de notícias). */
export async function POST(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  const at = future(body.at);
  if (!at) return NextResponse.json({ error: 'Escolha uma hora que ainda não passou.' }, { status: 400 });
  const slugs: string[] = Array.isArray(body.slugs) ? body.slugs.map(String).slice(0, 20) : [];
  try {
    return NextResponse.json({ ok: true, schedule: await addSchedule(at, slugs, typeof body.name === 'string' ? body.name : undefined) });
  } catch (err) {
    return fail(err, 'Não foi possível gravar o agendamento.');
  }
}

/** Edita um horário: nova hora, juntar/tirar uma notícia ou mudá-la de posição. Com `send: true`, envia-o já. */
export async function PATCH(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Agendamento inválido.' }, { status: 400 });
  try {
    if (body.send === true) return NextResponse.json({ ok: true, result: await runSchedule(body.id) });
    let at: string | undefined;
    if (body.at !== undefined) {
      at = future(body.at) ?? undefined;
      if (!at) return NextResponse.json({ error: 'Escolha uma hora que ainda não passou.' }, { status: 400 });
    }
    const dir = body.move?.dir === 1 ? 1 : body.move?.dir === -1 ? -1 : null;
    const schedule = await updateSchedule(body.id, {
      at,
      name: typeof body.name === 'string' ? body.name : undefined,
      add: typeof body.add === 'string' ? body.add : undefined,
      remove: typeof body.remove === 'string' ? body.remove : undefined,
      move: dir && typeof body.move?.slug === 'string' ? { slug: body.move.slug, dir } : undefined,
    });
    return NextResponse.json({ ok: true, schedule });
  } catch (err) {
    return fail(err, 'Não foi possível alterar o agendamento.');
  }
}

/** Cancela um agendamento. */
export async function DELETE(req: NextRequest) {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== 'string' || !body.id) return NextResponse.json({ error: 'Agendamento inválido.' }, { status: 400 });
  try {
    await removeSchedule(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err, 'Não foi possível cancelar.');
  }
}
