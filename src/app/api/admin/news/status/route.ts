import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// Supports both new format (sb_secret_...) and legacy JWT
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceKey);

export async function POST(req: NextRequest) {
  try {
    const { id, ids, status } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    const targetIds: string[] = ids ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('news')
      .update({ status })
      .in('id', targetIds);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: targetIds.length });
  } catch (err: any) {
    console.error('Erro ao atualizar status:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
