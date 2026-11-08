import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { loadPlanos, savePlanos } from '@/lib/assinaturas';
import { validarPlanos } from '@/lib/assinaturas-types';

const PERMISSIONS = ['editar_definicoes'];

/** Planos de subscrição e instruções de pagamento. */
export async function GET() {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  return NextResponse.json(await loadPlanos());
}

export async function PUT(req: NextRequest) {
  const guard = await requireAuth(...PERMISSIONS);
  if ('error' in guard) return guard.error;
  try {
    const result = validarPlanos(await req.json());
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    await savePlanos(result.config);
    return NextResponse.json({ ok: true, ...result.config });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao guardar os planos.' }, { status: 500 });
  }
}
