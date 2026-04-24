'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

// Criar o cliente com a chave moderna (evita erro de Legacy Keys)
const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function repairNewsImage(newsId: string, newUrl: string) {
  // A tabela "news" no Supabase é, na verdade, uma "View" (uma montra agregada).
  // Não podemos editar diretamente uma View. Temos de editar as tabelas base reais!
  
  const { data: dataBase, error: errBase } = await supabaseAdmin
    .from('baseagrodata_news')
    .update({ image_url: newUrl })
    .eq('id', newsId)
    .select();

  const { data: dataEntre, error: errEntre } = await supabaseAdmin
    .from('entrecampos_news')
    .update({ image_url: newUrl })
    .eq('id', newsId)
    .select();

  if (errBase && errEntre) {
    throw new Error(`Erro na base de dados: Não foi possível atualizar nenhuma tabela.`);
  }

  const baseUpdated = dataBase && dataBase.length > 0;
  const entreUpdated = dataEntre && dataEntre.length > 0;

  if (!baseUpdated && !entreUpdated) {
    throw new Error('A notícia não foi encontrada nas tabelas base (baseagrodata_news ou entrecampos_news).');
  }

  return true;
}
