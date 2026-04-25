import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id, ids } = await req.json();
    const targetIds: string[] = ids ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('news')
      .delete()
      .in('id', targetIds);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: targetIds.length });
  } catch (err: any) {
    console.error('Erro ao eliminar:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
