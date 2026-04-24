const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const WP_URL = 'https://entrecampos.co.mz/wp-json/wp/v2';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sanitizar nome do ficheiro para bater com o que subimos para o storage
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\.-]/g, '_')
    .replace(/_{2,}/g, '_');
}

async function importNews() {
  console.log('📥 Iniciando importação de notícias do WordPress...');
  const auth = Buffer.from('Admin:Administrador#01?*').toString('base64');
  
  let page = 1;
  let totalImported = 0;

  while (true) {
    console.log(`📄 Lendo Página ${page}...`);
    try {
      const response = await axios.get(`${WP_URL}/posts`, {
        params: { per_page: 50, page: page, _embed: true },
        headers: { 'Authorization': `Basic ${auth}` }
      });

      const posts = response.data;
      if (!posts || posts.length === 0) break;

      for (const post of posts) {
        // Tentar encontrar a imagem de destaque
        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
        const rawUrl = featuredMedia?.source_url;
        let imageUrl = '';

        if (rawUrl) {
          const fileName = sanitizeFilename(require('path').basename(rawUrl));
          const { data } = supabase.storage.from('news-images').getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }

        // Preparar dados da notícia
        const newsData = {
          title: post.title.rendered,
          slug: post.slug,
          summary: post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 160),
          content: post.content.rendered,
          category: 'geral', // Por agora, depois podemos mapear categorias
          image_url: imageUrl,
          date: post.date,
          site_id: 'entrecampos',
          views: 0
        };

        const { error } = await supabase.from('news').upsert(newsData, { onConflict: 'slug' });
        
        if (error) {
          console.error(`❌ Erro no post ${post.slug}:`, error.message);
        } else {
          totalImported++;
        }
      }
      page++;
    } catch (err) {
      if (err.response?.status === 400) {
        console.log('✅ Fim das páginas de notícias.');
      } else {
        console.error('❌ Erro na importação:', err.message);
      }
      break;
    }
  }

  console.log(`\n🎉 Importação concluída! Total: ${totalImported} notícias.`);
}

importNews();
