const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncNews() {
  console.log('🔄 Iniciando sincronização CORRIGIDA de notícias...');
  
  const postsPath = path.join(process.cwd(), 'data', 'posts.json');
  if (!fs.existsSync(postsPath)) return console.error('❌ Ficheiro data/posts.json não encontrado!');

  const posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
  console.log(`📦 Preparando ${posts.length} notícias.`);

  const newsToInsert = posts.map(post => {
    const cleanTitle = post.title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    const cleanContent = post.content.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
    
    // Gerar um resumo se não existir
    let summary = post.excerpt || cleanContent.substring(0, 160).replace(/<[^>]*>/g, '') + '...';
    if (!summary || summary.trim() === '...') summary = cleanTitle;

    return {
      title: cleanTitle,
      content: cleanContent,
      summary: summary, // CAMPO OBRIGATÓRIO
      slug: post.slug,
      category: post.category || 'Agricultura',
      date: new Date(post.pubDate).toISOString(),
      image_url: (post.images && post.images.length > 0) ? post.images[0] : null,
      views: Math.floor(Math.random() * 500) + 50
    };
  });

  console.log('📤 Enviando para o Supabase...');
  
  for (let i = 0; i < newsToInsert.length; i += 50) {
    const batch = newsToInsert.slice(i, i + 50);
    const { error } = await supabase.from('news').upsert(batch, { onConflict: 'slug' });
    if (error) {
      console.error(`❌ Erro no lote ${i/50 + 1}:`, error.message);
    } else {
      console.log(`✨ Lote ${i/50 + 1} sincronizado.`);
    }
  }

  console.log('\n🎉 Sincronização concluída! Verifique o painel agora.');
}

syncNews();
