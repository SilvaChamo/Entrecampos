import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { SESSION_COOKIE, verifySession } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';

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

const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';

/** Só estes campos vêm do formulário; o resto (site_id, autor, views, datas…) é decidido no servidor. */
const WRITABLE_FIELDS = ['title', 'slug', 'content', 'summary', 'category', 'image_url', 'date'] as const;

const FEATURED_WARNING =
  'Notícia guardada, mas a coluna "featured" ainda não existe na base de dados: execute sql/add-featured.sql para activar o Destaque.';

/** Tenta com o campo `featured`; se a coluna ainda não existir, repete sem ele e avisa. */
async function saveWithFeaturedFallback(
  run: (payload: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>,
  payload: Record<string, unknown>,
) {
  let result = await run(payload);
  if (result.error && 'featured' in payload && /featured/i.test(result.error.message || '')) {
    const { featured: _featured, ...withoutFeatured } = payload;
    result = await run(withoutFeatured);
    return { ...result, warning: result.error ? undefined : FEATURED_WARNING };
  }
  return { ...result, warning: undefined as string | undefined };
}

/** Faz a home, as categorias e a página de leitura mostrarem logo a notícia nova/editada. */
function refreshPublicPages() {
  revalidatePath('/', 'layout');
}

export async function POST(request: Request) {
  try {
    // 1) Autenticação: cookie de sessão assinado, criado no login.
    const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada. Inicie sessão.' }, { status: 401 });
    }

    const data = await request.json();
    const { isEdit, id } = data as { isEdit?: boolean; id?: string };

    // 2) Autorização pelo papel (mesmas regras de src/lib/permissions.ts).
    const permission = isEdit ? 'editar_artigos' : 'criar_artigos';
    if (!hasPermission(session.role, permission)) {
      return NextResponse.json({ error: 'Não tem permissão para esta operação.' }, { status: 403 });
    }
    const canPublish = hasPermission(session.role, 'publicar_artigos');

    // 3) Campos permitidos; site e autor vêm do servidor/sessão, nunca do pedido.
    const payload: Record<string, unknown> = {};
    for (const field of WRITABLE_FIELDS) {
      if (data[field] !== undefined) payload[field] = data[field];
    }
    payload.site_id = SITE_ID;
    if (canPublish) {
      if (data.featured !== undefined) payload.featured = !!data.featured;
    } else {
      // Contribuidores não publicam nem destacam: a notícia fica a aguardar revisão.
      payload.status = 'pending';
    }

    // Nome de exibição do autor, segundo as preferências do utilizador autenticado.
    const finalAuthorId = session.id;
    let finalAuthorName = session.name || 'Administrador';
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(session.id);
    if (userData?.user) finalAuthorName = getDisplayName(userData.user);

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
      
      const { data: updateData, error, warning } = await saveWithFeaturedFallback(
        (body) => supabaseAdmin.from('entrecampos_news').update(body).eq('id', id).select(),
        updatePayload,
      );

      if (error) throw error;
      refreshPublicPages();
      return NextResponse.json({ success: true, data: updateData, warning });
    } else {
      const insertPayload: any = { 
        ...payload, 
        author_name: finalAuthorName 
      };
      if (finalAuthorId) {
        insertPayload.author_id = finalAuthorId;
      }
      
      const { data: insertData, error, warning } = await saveWithFeaturedFallback(
        (body) => supabaseAdmin.from('entrecampos_news').insert([body]).select(),
        insertPayload,
      );

      if (error) throw error;
      refreshPublicPages();
      return NextResponse.json({ success: true, data: insertData, warning });
    }
  } catch (error: any) {
    console.error('Error saving news:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
