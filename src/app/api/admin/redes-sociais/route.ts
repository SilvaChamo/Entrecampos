import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { configured, connectionStatus, keysState, loadProfiles, loadSettings, saveKeys, saveProfiles, saveSettings, NETWORKS } from '@/lib/social';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Redes escolhidas, perfis, que chaves estão definidas (só sim/não e de onde vêm) e, com ?check=1, o estado da ligação. Nunca devolve o token nem os IDs. */
export async function GET(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  const [settings, profiles, keys, ok] = await Promise.all([loadSettings(), loadProfiles(), keysState(), configured()]);
  const connection = req.nextUrl.searchParams.get('check') === '1' ? await connectionStatus() : null;
  return NextResponse.json({ settings, profiles, configured: ok, keys, connection });
}

/** Liga ou desliga cada rede e guarda os endereços dos perfis e as chaves (estas vão cifradas, só o servidor as lê). */
export async function PUT(req: NextRequest) {
  const guard = await requireAuth('editar_definicoes');
  if ('error' in guard) return guard.error;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const patch: Record<string, boolean> = {};
    for (const n of NETWORKS) if (typeof body[n] === 'boolean') patch[n] = body[n] as boolean;
    if (body.keys && typeof body.keys === 'object') await saveKeys(body.keys as Record<string, unknown>);
    const profiles = body.profiles && typeof body.profiles === 'object' ? await saveProfiles(body.profiles as Record<string, unknown>) : undefined;
    return NextResponse.json({ ok: true, settings: await saveSettings(patch), ...(profiles ? { profiles } : {}) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erro ao guardar as definições.' }, { status: 500 });
  }
}
