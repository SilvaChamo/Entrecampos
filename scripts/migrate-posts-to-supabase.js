const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpbeveroicyhgezbmldf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_tT_7Rv_M1mCYyYxEK7gUjw_5j_5PiJm';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de categorias
const categoryMap = {
  'Agricultura': 'agricultura',
  'Agro-negócio': 'agro-negocio',
  'Comunidade': 'comunidade',
  'Ambiente': 'ambiente',
  'Turismo Rural': 'turismo-rural',
  'Mulher Agrário': 'mulher-agrario',
  'Curiosidade': 'curiosidade',
  'Sector Agrário': 'agro-negocio',
  'Turismo': 'turismo-rural',
  'Mulher no Agrário': 'mulher-agrario'
};

// Função para limpar CDATA
function cleanCDATA(text) {
  if (!text) return '';
  return text.replace(/<!\[CDATA\[|\]\]>/g, '');
}

// Função para gerar slug único
function generateSlug(title) {
  const cleaned = cleanCDATA(title);
  return cleaned
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 200);
}

// Função para parsear data
function parseDate(dateString) {
  if (!dateString) return new Date().toISOString();
  const date = new Date(dateString);
  return date.toISOString();
}

// Função principal de migração
async function migratePosts() {
  try {
    console.log('📖 Lendo posts.json...');
    const postsPath = path.join(__dirname, '../data/posts.json');
    const postsData = fs.readFileSync(postsPath, 'utf-8');
    const posts = JSON.parse(postsData);

    console.log(`📊 Encontrados ${posts.length} posts para migrar`);

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const post of posts) {
      try {
        // Limpar dados
        const title = cleanCDATA(post.title);
        const category = categoryMap[post.category] || 'agricultura';
        const slug = post.slug || generateSlug(title);
        const date = parseDate(post.pubDate);
        const image = post.images && post.images.length > 0 ? post.images[0] : null;
        const excerpt = post.excerpt || post.content?.substring(0, 200) || '';
        const content = post.content || '';

        // Verificar se slug já existe
        const { data: existing } = await supabase
          .from('news')
          .select('id')
          .eq('slug', slug)
          .single();

        if (existing) {
          console.log(`⏭️  Pulando (já existe): ${title}`);
          skipCount++;
          continue;
        }

        // Inserir no Supabase
        const { data, error } = await supabase
          .from('news')
          .insert({
            title: title,
            summary: excerpt,
            content: content,
            category: category,
            image_url: image,
            date: date,
            site_id: 'entrecampos',
            slug: slug
          })
          .select();

        if (error) {
          console.error(`❌ Erro ao inserir "${title}":`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Inserido: ${title}`);
          successCount++;
        }

      } catch (err) {
        console.error(`❌ Erro ao processar post:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📈 Resumo da migração:');
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`⏭️  Pulados: ${skipCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${posts.length}`);

  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    process.exit(1);
  }
}

// Executar migração
migratePosts();
