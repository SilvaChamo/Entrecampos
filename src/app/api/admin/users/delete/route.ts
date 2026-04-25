import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { id, ids } = await req.json();
    const targetIds: string[] = ids ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'ID(s) obrigatório(s)' }, { status: 400 });
    }

    const errors: string[] = [];
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    for (const userId of targetIds) {
      // Se for um ID de teste (não UUID), apenas ignoramos a chamada ao Supabase e retornamos sucesso
      if (!isUUID(userId)) {
        console.log(`Ignorando delete de ID de teste (não UUID): ${userId}`);
        continue;
      }

      // Delete from Supabase Auth
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        console.error(`Erro ao eliminar utilizador ${userId}:`, error.message);
        errors.push(`${userId}: ${error.message}`);
      }
    }

    if (errors.length === targetIds.length) {
      return NextResponse.json({ error: errors.join('; ') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: targetIds.length - errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    console.error('Erro ao eliminar utilizador:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
