import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-guard';
import { hasPermission } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Supports both new format (sb_secret_...) and legacy JWT
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

const ALLOWED_STATUS = ['published', 'draft', 'pending', 'trash', 'archived']; // comparados em minúsculas

export async function POST(req: NextRequest) {
  const guard = await requireAuth('publicar_artigos', 'rever_artigos');
  if ('error' in guard) return guard.error;
  try {
    const { id, ids, status } = await req.json();

    if (typeof status !== 'string' || !ALLOWED_STATUS.includes(status.toLowerCase())) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }
    // Só quem pode publicar publica; quem só revê não pode pôr a notícia online.
    if (status.toLowerCase() === 'published' && !hasPermission(guard.session.role, 'publicar_artigos')) {
      return NextResponse.json({ error: 'Não tem permissão para publicar.' }, { status: 403 });
    }

    const targetIds: string[] = ((ids ? ids : id ? [id] : []) as unknown[]).map(String);

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('news')
      .update({ status })
      .eq('site_id', process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos') // só notícias deste site
      .in('id', targetIds);

    if (error) {
      console.error('Supabase error:', error);
      const missing = /Could not find the 'status' column/i.test(error.message);
      return NextResponse.json(
        { error: missing ? 'A tabela news ainda não tem a coluna status: corra sql/entrecampos-colunas.sql no Supabase.' : error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, updated: targetIds.length });
  } catch (err: any) {
    console.error('Erro ao atualizar status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
