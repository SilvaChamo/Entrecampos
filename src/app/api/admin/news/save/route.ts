import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Função para determinar o nome de exibição baseado nas preferências do usuário
function getDisplayName(user: any): string {
  if (!user) return 'Administrador';
  
  const metadata = user.user_metadata || {};
  const displayNameType = metadata.displayNameType || 'full_name';
  const firstName = metadata.first_name || '';
  const lastName = metadata.last_name || '';
  const alcunha = metadata.alcunha || '';
  
  switch (displayNameType) {
    case 'alcunha':
      return alcunha || `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Administrador';
    case 'first_name_only':
      return firstName || user.email?.split('@')[0] || 'Administrador';
    case 'full_name':
    default:
      return `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Administrador';
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { isEdit, id, author_id, author_name, ...payload } = data;

    // Se author_id foi fornecido, buscar o usuário para determinar o nome de exibição
    let finalAuthorName = author_name;
    let finalAuthorId = author_id;
    
    if (author_id && !author_name) {
      // Buscar usuário pelo ID para pegar preferências de exibição
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(author_id);
      if (userData && userData.user) {
        finalAuthorName = getDisplayName(userData.user);
      } else {
        finalAuthorName = 'Administrador';
      }
    }
    
    // Fallback se não tiver autor definido
    if (!finalAuthorName) {
      finalAuthorName = 'Administrador';
    }

    if (isEdit) {
      if (!id) {
        return NextResponse.json({ error: 'ID is required for editing' }, { status: 400 });
      }
      
      const updatePayload: any = { ...payload };
      if (finalAuthorName) {
        updatePayload.author_name = finalAuthorName;
      }
      if (finalAuthorId) {
        updatePayload.author_id = finalAuthorId;
      }
      
      const { data: updateData, error } = await supabaseAdmin
        .from('entrecampos_news')
        .update(updatePayload)
        .eq('id', id)
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data: updateData });
    } else {
      const insertPayload: any = { 
        ...payload, 
        author_name: finalAuthorName 
      };
      if (finalAuthorId) {
        insertPayload.author_id = finalAuthorId;
      }
      
      const { data: insertData, error } = await supabaseAdmin
        .from('entrecampos_news')
        .insert([insertPayload])
        .select();

      if (error) throw error;
      return NextResponse.json({ success: true, data: insertData });
    }
  } catch (error: any) {
    console.error('Error saving news:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
