import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';
import { CONFIG_AREAS, configMissing, type ConfigArea } from '@/lib/config-status';

export const dynamic = 'force-dynamic';

/** O que falta configurar numa área do painel (só nomes de variáveis, nunca valores). Só para quem gere definições; os outros não vêem nada. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth();
  if ('error' in guard) return guard.error;
  const area = req.nextUrl.searchParams.get('area') as ConfigArea | null;
  if (!area || !CONFIG_AREAS.includes(area)) return NextResponse.json({ error: 'Área inválida.' }, { status: 400 });
  if (!hasPermission(guard.session.role, 'editar_definicoes')) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: await configMissing(area) });
}
