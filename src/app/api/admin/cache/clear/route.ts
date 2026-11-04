import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { refreshSite } from '@/lib/refresh-site';

/** Limpeza manual do cache do site (só administrador). A automática corre todos os sábados. */
export async function POST() {
  const guard = await requireAuth('acesso_total');
  if ('error' in guard) return guard.error;
  refreshSite();
  return NextResponse.json({ success: true, message: 'Cache do site limpo.', timestamp: new Date().toISOString() });
}
