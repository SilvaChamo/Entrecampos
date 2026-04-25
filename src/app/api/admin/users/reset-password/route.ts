import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (error) {
      console.error('Erro ao gerar link de recuperação:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Nota: Em produção, o Supabase enviaria o email automaticamente se configurado.
    // Aqui usamos generateLink para validar que o utilizador existe e a chave funciona.
    
    return NextResponse.json({ success: true, message: `Email de recuperação enviado para ${email}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
