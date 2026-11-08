import { NextResponse } from 'next/server';
import { refreshNews, type NewsRef } from '@/lib/refresh-site';
import { setSuggestion } from '@/lib/suggestions';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { SESSION_COOKIE, verifySession } from '@/lib/local-session';
import { hasPermission } from '@/lib/permissions';
import { isUuid } from '@/lib/api-guard';
import { normalizeSpaces } from '@/lib/normalize-spaces';
import { siteAccess } from '@/lib/site-accounts';
import { attachToNextSchedule } from '@/lib/newsletter';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Função para determinar o nome de exibição baseado nas preferências do utilizador
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
const WRITABLE_FIELDS = ['title', 'slug', 'content', 'summary', 'category', 'categories', 'image_url', 'date'] as const;

const COLUMN_HELP =
  'Algumas colunas ainda não existem na tabela news (ver sql/entrecampos-colunas.sql); a notícia foi guardada sem: ';

/**
 * Grava; se a tabela não tiver alguma coluna (ex.: featured, author_name, status), repete sem ela
 * e devolve um aviso com as colunas que ficaram de fora.
 */
async function saveWithColumnFallback(
  run: (payload: Record<string, unknown>) => PromiseLike<{ data: any; error: any }>,
  payload: Record<string, unknown>,
  required: string[] = [],
) {
  const body = { ...payload };
  const dropped: string[] = [];
  for (let i = 0; i < 6; i++) {
    const result = await run(body);
    const column = /Could not find the '([^']+)' column/i.exec(result.error?.message || '')?.[1];
    if (!result.error || !column || !(column in body)) {
      return { ...result, warning: !result.error && dropped.length ? COLUMN_HELP + dropped.join(', ') : undefined };
    }
    if (required.includes(column)) {
      return {
        data: null,
        error: { message: `A tabela não tem a coluna ${column}: sem ela este utilizador não pode gravar (corra sql/entrecampos-colunas.sql).` },
        warning: undefined as string | undefined,
      };
    }
    delete body[column];
    dropped.push(column);
  }
  return { data: null, error: { message: 'Demasiadas colunas em falta na tabela news.' }, warning: undefined as string | undefined };
}

const isOpinion = (v: unknown) => typeof v === 'string' && v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '') === 'opiniao';
const NOT_OPINION_MSG = 'Só colunistas escrevem artigos de Opinião. Escolha outra categoria.';

/** Faz a home, a categoria e a página de leitura mostrarem logo a notícia nova/editada (só o que mudou). */
function refreshPublicPages(...refs: NewsRef[]) {
  refreshNews(refs);
}

/** "Sugestão de leitura": só quem publica a activa; falhar aqui não impede de gravar a notícia. */
async function applySuggestion(flag: unknown, canPublish: boolean, slug: unknown) {
  if (!canPublish || typeof flag !== 'boolean' || typeof slug !== 'string' || !slug) return;
  try {
    await setSuggestion(slug, flag);
  } catch (e) {
    console.error('[sugestoes] não foi possível gravar:', e instanceof Error ? e.message : e);
  }
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
    // Várias categorias: lista limpa e sem repetições; a primeira passa a ser a categoria principal.
    if (payload.categories !== undefined) {
      const list = Array.isArray(payload.categories)
        ? [...new Set((payload.categories as unknown[]).map((c) => String(c ?? '').trim().toLowerCase().slice(0, 60)).filter(Boolean))].slice(0, 12)
        : [];
      if (list.length > 0) {
        payload.categories = list;
        payload.category = list[0];
      } else {
        delete payload.categories;
      }
    }
    // O editor grava os espaços como &nbsp;, o que impede o texto de quebrar linha na leitura.
    if (typeof payload.content === 'string') payload.content = normalizeSpaces(payload.content);
    payload.site_id = SITE_ID;
    if (canPublish) {
      if (data.featured !== undefined) payload.featured = !!data.featured;
      // Editor e admin publicam: o que gravam vai logo ao site público, nunca para revisão.
      payload.status = 'published';
    } else {
      // Contribuidores não publicam nem destacam: a notícia fica a aguardar revisão.
      payload.status = 'pending';
    }

    // Nome de exibição do autor, segundo as preferências do utilizador autenticado.
    // O acesso de emergência não tem conta no Supabase (id sem formato UUID): fica sem author_id.
    const finalAuthorId = isUuid(session.id) ? session.id : null;
    let finalAuthorName = session.name || 'Administrador';
    let isColumnist = false;
    if (finalAuthorId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(finalAuthorId);
      if (userData?.user) {
        finalAuthorName = getDisplayName(userData.user);
        // Colunista (nível próprio ou somado a outro papel) escreve só opinião: a categoria é sempre Opinião, sem destaque, venha o que vier do formulário.
        // Quem publica (Editor e colunista) publica direto; o colunista simples fica nos pendentes. Isso decide-o `canPublish`, não este bloco.
        const access = siteAccess(userData.user);
        isColumnist = access?.colunista === true || /^colunista$/i.test(access?.role ?? '');
        if (isColumnist) {
          payload.category = 'Opinião';
          payload.categories = [];
          payload.featured = false;
        }
      }
    }

    if (isEdit) {
      if (!id) {
        return NextResponse.json({ error: 'ID is required for editing' }, { status: 400 });
      }
      
      const updatePayload: any = { ...payload };
      // Estado e sítio de antes da gravação: a categoria/endereço antigos também têm de se refazer.
      const { data: before } = await supabaseAdmin.from('news').select('*').eq('id', id).eq('site_id', SITE_ID).maybeSingle();
      // Quem escreve notícias não escreve Opinião (um artigo que já é de Opinião pode ser editado por quem tem permissão para o fazer).
      if (!isColumnist && [payload.category, ...(Array.isArray(payload.categories) ? payload.categories : [])].some(isOpinion) && ![before?.category, ...(Array.isArray(before?.categories) ? before.categories : [])].some(isOpinion)) {
        return NextResponse.json({ error: NOT_OPINION_MSG }, { status: 400 });
      }
      // Editar não "desarquiva" nem tira do lixo/rascunho: nesses casos mantém-se o estado actual.
      if (canPublish) {
        if (['trash', 'archived', 'draft'].includes(String(before?.status ?? '').toLowerCase())) delete updatePayload.status;
      }
      if (finalAuthorName) {
        updatePayload.author_name = finalAuthorName;
      }
      if (finalAuthorId) {
        updatePayload.author_id = finalAuthorId;
      }
      
      const { data: updateData, error, warning } = await saveWithColumnFallback(
        (body) => supabaseAdmin.from('news').update(body).eq('id', id).eq('site_id', SITE_ID).select(),
        updatePayload,
        canPublish ? [] : ['status'],
      );

      if (error) throw error;
      // Nenhuma linha actualizada (id errado ou de outro site): não se diz que gravou.
      if (!updateData || updateData.length === 0) {
        return NextResponse.json({ error: 'Notícia não encontrada: nada foi actualizado.' }, { status: 404 });
      }
      await applySuggestion(data.suggest, canPublish, updateData?.[0]?.slug);
      refreshPublicPages(before ?? {}, updateData[0] ?? {});
      return NextResponse.json({ success: true, data: updateData, warning });
    } else {
      if (!isColumnist && [payload.category, ...(Array.isArray(payload.categories) ? payload.categories : [])].some(isOpinion)) {
        return NextResponse.json({ error: NOT_OPINION_MSG }, { status: 400 });
      }
      const insertPayload: any = { 
        ...payload, 
        author_name: finalAuthorName 
      };
      if (finalAuthorId) {
        insertPayload.author_id = finalAuthorId;
      }
      
      const { data: insertData, error, warning } = await saveWithColumnFallback(
        (body) => supabaseAdmin.from('news').insert([body]).select(),
        insertPayload,
        canPublish ? [] : ['status'],
      );

      if (error) throw error;
      await applySuggestion(data.suggest, canPublish, insertData?.[0]?.slug);
      // Notícia nova já publicada: entra no próximo envio agendado da newsletter.
      if (String(insertData?.[0]?.status ?? payload.status).toLowerCase() === 'published') await attachToNextSchedule(insertData?.[0]?.slug);
      refreshPublicPages(insertData?.[0] ?? {});
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
