const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env.local' });

const WP_URL = 'https://entrecampos.co.mz/wp-json/wp/v2';
const BUCKET_NAME = 'news-images';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Normalizar URL (remover dimensões do WP tipo -1024x768)
function normalizeWpUrl(url) {
  if (!url) return '';
  return url.replace(/-\d+x\d+(?=\.(jpg|jpeg|png|gif|webp))/i, '');
}

// Sanitizar nome do ficheiro para o Supabase (remover acentos e caracteres especiais)
function sanitizeFilename(filename) {
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\.-]/g, '_')     // Substitui tudo o que não é letra/número por underscore
    .replace(/_{2,}/g, '_');        // Remove underscores duplicados
}

async function migrateAllMedia() {
  console.log('🚀 Iniciando migração completa da Biblioteca de Media (Alvo: 145 fotos)...');
  
  try {
    const auth = Buffer.from('Admin:Administrador#01?*').toString('base64');
    const tempDir = path.join(__dirname, '../temp-all-media');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const processedImages = new Map(); // NormalUrl -> SupabaseUrl
    let page = 1;
    let totalMigrated = 0;
    let hasMore = true;

    // Primeiro: Listar ficheiros já existentes no Supabase para evitar duplicar se corrermos de novo
    const { data: existingFiles } = await supabase.storage.from(BUCKET_NAME).list();
    const existingFileNames = new Set(existingFiles?.map(f => f.name) || []);

    while (hasMore) {
      console.log(`\n📄 Lendo Media - Página ${page}...`);
      try {
        const response = await axios.get(`${WP_URL}/media`, {
          params: { per_page: 50, page: page },
          headers: { 'Authorization': `Basic ${auth}` }
        });

        const mediaItems = response.data;
        if (mediaItems.length === 0) break;

        for (const item of mediaItems) {
          const rawUrl = item.source_url;
          if (!rawUrl) continue;

          // Nome do ficheiro original do WP e versão sanitizada
          const originalName = path.basename(rawUrl);
          const cleanName = sanitizeFilename(originalName);
          const normalUrl = normalizeWpUrl(rawUrl);

          // Verificar se já processamos nesta sessão ou se já existe no bucket
          if (existingFileNames.has(cleanName)) {
            console.log(`⏩ Já existe: ${cleanName}`);
            continue;
          }

          console.log(`📥 Descarregando: ${originalName} -> ${cleanName}...`);
          await new Promise(r => setTimeout(r, 300));
          
          const filepath = path.join(tempDir, cleanName);

          try {
            const imgRes = await axios({ url: rawUrl, method: 'GET', responseType: 'stream' });
            const writer = fs.createWriteStream(filepath);
            imgRes.data.pipe(writer);
            await new Promise((res, rej) => { writer.on('finish', res); writer.on('error', rej); });

            const fileBuffer = fs.readFileSync(filepath);
            const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(cleanName, fileBuffer, {
              contentType: item.mime_type || 'image/jpeg',
              upsert: true
            });

            if (!uploadError) {
              console.log(`✅ Subido: ${cleanName}`);
              totalMigrated++;
            } else {
              console.error(`❌ Erro upload ${cleanName}:`, uploadError.message);
            }
          } catch (e) {
            console.error(`❌ Erro no item ${cleanName}`);
          } finally {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
          }
        }
        page++;
      } catch (err) {
        console.error(`❌ Erro na página ${page}:`, err.response?.status, err.response?.data || err.message);
        hasMore = false;
      }
    }

    console.log(`\n🎉 Migração de Media concluída! Total novos: ${totalMigrated}`);
    
    // Agora: Tentar vincular novamente os posts às novas imagens
    console.log('\n🔗 Atualizando vínculos nas notícias...');
    let postPage = 1;
    while (true) {
      const { data: posts } = await axios.get(`${WP_URL}/posts`, {
        params: { per_page: 50, page: postPage, _embed: true },
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (!posts || posts.length === 0) break;

      for (const post of posts) {
        const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
        const rawUrl = featuredMedia?.source_url;
        if (rawUrl) {
          const fileName = sanitizeFilename(path.basename(rawUrl));
          const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          await supabase.from('news').update({ image_url: publicUrl }).eq('slug', post.slug);
        }
      }
      postPage++;
    }

    if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
  } catch (err) {
    console.error('Erro fatal:', err.message);
  }
}

migrateAllMedia();
