const fs = require('fs');
const xml2js = require('xml2js');
require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  console.log('Iniciando o processo de limpeza e importação...');
  const parser = new xml2js.Parser({ explicitArray: false });

  // 1. Ler ficheiro de imagens
  const imgXml = fs.readFileSync('wpxml/img.WP.2026-04-24.xml', 'utf8');
  const imgData = await parser.parseStringPromise(imgXml);
  const images = {};
  
  const imgItems = imgData.rss.channel.item || [];
  const imgArray = Array.isArray(imgItems) ? imgItems : [imgItems];
  
  for (const item of imgArray) {
    if (item['wp:post_type'] === 'attachment') {
      const postId = item['wp:post_id'];
      const url = item['wp:attachment_url'];
      images[postId] = url;
    }
  }
  console.log(`Carregadas ${Object.keys(images).length} imagens do ficheiro XML.`);

  // 2. Ler ficheiro de notícias
  const newsXml = fs.readFileSync('wpxml/noticias.WP.2026-04-24.xml', 'utf8');
  const newsData = await parser.parseStringPromise(newsXml);
  
  const newsItems = newsData.rss.channel.item || [];
  const newsArray = Array.isArray(newsItems) ? newsItems : [newsItems];
  
  const postsToInsert = [];
  
  for (const item of newsArray) {
    if (item['wp:post_type'] === 'post' && item['wp:status'] === 'publish') {
      
      // Encontrar a categoria (domain="category")
      let category = 'Geral';
      if (item.category) {
        const cats = Array.isArray(item.category) ? item.category : [item.category];
        const catObj = cats.find(c => c['$'] && c['$'].domain === 'category');
        if (catObj && catObj['_']) category = catObj['_'];
        else if (cats.length > 0 && typeof cats[0] === 'string') category = cats[0];
      }

      // Encontrar _thumbnail_id
      let thumbnailId = null;
      if (item['wp:postmeta']) {
        const meta = Array.isArray(item['wp:postmeta']) ? item['wp:postmeta'] : [item['wp:postmeta']];
        const thumbMeta = meta.find(m => m['wp:meta_key'] === '_thumbnail_id');
        if (thumbMeta) thumbnailId = thumbMeta['wp:meta_value'];
      }

      let imageUrl = thumbnailId && images[thumbnailId] ? images[thumbnailId] : null;
      if (!imageUrl) {
          // tentar extrair do content
          const content = item['content:encoded'] || '';
          const match = content.match(/src="([^"]+)"/);
          if (match) imageUrl = match[1];
      }

      let content = item['content:encoded'] || '';
      let summary = item['excerpt:encoded'] || '';
      if (!summary) {
        summary = content.replace(/(<([^>]+)>)/gi, "").substring(0, 150) + '...';
      }

      postsToInsert.push({
        id: crypto.randomUUID(),
        title: item.title || 'Sem título',
        content: content,
        summary: summary,
        category: category,
        image_url: imageUrl,
        date: new Date(item['wp:post_date']).toISOString(),
        views: 0,
        site_id: 'entrecampos',
        slug: (item['wp:post_name'] || 'news') + '-' + crypto.randomUUID().substring(0,8)
      });
    }
  }

  console.log(`Preparadas ${postsToInsert.length} notícias para inserção.`);

  // 3. Limpeza das tabelas
  console.log('A apagar notícias do Entrecampos que estavam na tabela baseagrodata_news...');
  const { error: err1 } = await supabase
    .from('baseagrodata_news')
    .delete()
    .like('image_url', '%entrecampos.co.mz%');
  if (err1) console.error('Erro na limpeza da baseagrodata:', err1);

  console.log('A limpar a tabela entrecampos_news...');
  const { error: err2 } = await supabase
    .from('entrecampos_news')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Apaga tudo
  if (err2) console.error('Erro na limpeza do entrecampos:', err2);

  // 4. Injeção dos dados em blocos
  console.log('A injetar notícias...');
  const chunkSize = 50;
  for (let i = 0; i < postsToInsert.length; i += chunkSize) {
    const chunk = postsToInsert.slice(i, i + chunkSize);
    const { error: err3 } = await supabase.from('entrecampos_news').insert(chunk);
    if (err3) {
        console.error('Erro ao inserir lote:', err3);
    } else {
        console.log(`Inseridas ${i + chunk.length} de ${postsToInsert.length}...`);
    }
  }

  console.log('✅ PROCESSO CONCLUÍDO COM SUCESSO!');
}

run().catch(console.error);
