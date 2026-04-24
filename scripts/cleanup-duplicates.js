const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = 'news-images';

async function cleanupDuplicates() {
  console.log('🧹 Iniciando limpeza AGRESSIVA de duplicados no Storage...');
  
  const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list('', {
    limit: 1000
  });

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  console.log(`📊 Total de ficheiros no Storage: ${files.length}`);

  const groups = new Map();

  files.forEach(file => {
    // Normalização agressiva:
    // 1. Remover dimensões tipo -1024x768
    // 2. Remover sufixos tipo -scaled
    // 3. Remover timestamps tipo -171395...
    let baseName = file.name
      .replace(/-\d+x\d+(?=\.(jpg|jpeg|png|gif|webp))/i, '')
      .replace(/-scaled(?=\.(jpg|jpeg|png|gif|webp))/i, '')
      .replace(/-\d{10,}(?=\.(jpg|jpeg|png|gif|webp))/i, '') // Timestamps de 10+ dígitos
      .replace(/^\d+-/, ''); // Timestamp no início

    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName).push(file);
  });

  const toDelete = [];
  const toKeep = [];

  groups.forEach((instances, baseName) => {
    // Ordenar por tamanho (maior primeiro) para manter a imagem com melhor qualidade
    instances.sort((a, b) => (b.metadata?.size || 0) - (a.metadata?.size || 0));
    
    toKeep.push(instances[0].name);
    
    if (instances.length > 1) {
      instances.slice(1).forEach(i => toDelete.push(i.name));
    }
  });

  console.log(`✅ Imagens únicas a manter: ${toKeep.length}`);
  console.log(`🗑️ Duplicados/Miniaturas a eliminar: ${toDelete.length}`);

  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 100) {
      const batch = toDelete.slice(i, i + 100);
      const { error: delError } = await supabase.storage.from(BUCKET_NAME).remove(batch);
      if (!delError) console.log(`✨ Lote ${i/100 + 1} eliminado.`);
    }
  }

  console.log('\n🎉 Limpeza concluída com sucesso!');
}

cleanupDuplicates();
