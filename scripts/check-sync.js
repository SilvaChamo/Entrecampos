const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSync() {
  console.log('🔍 Verificando sincronização...');
  
  const { data: news, error } = await supabase.from('news').select('id, title, image_url');
  if (error) {
    console.error('Erro ao ler notícias:', error);
    return;
  }

  const synced = news.filter(n => n.image_url && n.image_url.includes('news-images'));
  const missing = news.filter(n => !n.image_url || !n.image_url.includes('news-images'));

  console.log(`📊 Total de Notícias: ${news.length}`);
  console.log(`✅ Sincronizadas: ${synced.length}`);
  console.log(`❌ Pendentes: ${missing.length}`);

  if (missing.length > 0) {
    console.log('\nExemplo de pendentes:');
    missing.slice(0, 5).forEach(m => console.log(`- ${m.title} (${m.image_url || 'Sem URL'})`));
  }
}

checkSync();
