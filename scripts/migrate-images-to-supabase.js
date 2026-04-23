const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp');

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bpbeveroicyhgezbmldf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_tT_7Rv_M1mCYyYxEK7gUjw_5j_5PiJm';

const supabase = createClient(supabaseUrl, supabaseKey);

// Nome do bucket no Supabase Storage
const BUCKET_NAME = 'news-images';

// Tamanho máximo da imagem (250KB)
const MAX_SIZE_KB = 250;
const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;

// Função para download de imagem
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);

    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Função para compressão de imagem (máx 250KB, qualidade mantida)
async function compressImage(inputPath, outputPath) {
  try {
    const originalStats = fs.statSync(inputPath);
    const originalSizeKB = originalStats.size / 1024;
    
    console.log(`📊 Tamanho original: ${originalSizeKB.toFixed(2)} KB`);
    
    // Se já está abaixo do limite, apenas converte para JPEG otimizado
    if (originalStats.size <= MAX_SIZE_BYTES) {
      await sharp(inputPath)
        .jpeg({ quality: 90, progressive: true, mozjpeg: true })
        .toFile(outputPath);
      console.log(`✅ Imagem já otimizada (< ${MAX_SIZE_KB}KB)`);
      return;
    }
    
    // Calcular qualidade necessária para atingir ~250KB
    // Começamos com 90% e vamos diminuindo até atingir o tamanho
    let quality = 90;
    let width = 1200; // Largura máxima
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await sharp(inputPath)
        .resize(width, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ 
          quality: quality, 
          progressive: true, 
          mozjpeg: true,
          chromaSubsampling: '4:2:0'
        })
        .toFile(outputPath);
      
      const compressedStats = fs.statSync(outputPath);
      const compressedSizeKB = compressedStats.size / 1024;
      
      console.log(`🔄 Tentativa ${attempts + 1}: ${compressedSizeKB.toFixed(2)} KB (qualidade: ${quality}%, largura: ${width}px)`);
      
      if (compressedStats.size <= MAX_SIZE_BYTES) {
        console.log(`✅ Compressão concluída: ${compressedSizeKB.toFixed(2)} KB`);
        return;
      }
      
      // Ajustar qualidade e dimensões
      quality -= 5;
      if (quality < 50) {
        width = Math.floor(width * 0.9);
        quality = 85;
      }
      
      attempts++;
    }
    
    console.log(`⚠️ Não foi possível atingir ${MAX_SIZE_KB}KB, usando menor possível`);
    
  } catch (error) {
    console.error('❌ Erro na compressão:', error);
    // Se falhar, copiar original
    fs.copyFileSync(inputPath, outputPath);
  }
}

// Função para fazer upload para Supabase Storage
async function uploadToSupabase(filepath, filename) {
  const fileBuffer = fs.readFileSync(filepath);
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    throw error;
  }

  // Obter URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  return publicUrl;
}

// Função principal
async function migrateImages() {
  try {
    console.log('📖 Lendo posts.json...');
    const postsPath = path.join(__dirname, '../data/posts.json');
    const postsData = fs.readFileSync(postsPath, 'utf-8');
    const posts = JSON.parse(postsData);

    console.log(`📊 Encontrados ${posts.length} posts`);

    // Criar diretório temporário
    const tempDir = path.join(__dirname, '../temp-images');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const post of posts) {
      if (!post.images || post.images.length === 0) {
        skipCount++;
        continue;
      }

      const imageUrl = post.images[0];
      const filename = `${post.slug || 'image'}-${Date.now()}.jpg`;
      const filepath = path.join(tempDir, filename);

      try {
        console.log(`⬇️  Baixando: ${imageUrl}`);
        
        // Download
        await downloadImage(imageUrl, filepath);
        
        // Compressão de imagem
        const compressedPath = path.join(tempDir, `compressed-${filename}`);
        await compressImage(filepath, compressedPath);
        
        // Upload para Supabase (usar imagem comprimida)
        const publicUrl = await uploadToSupabase(compressedPath, filename);
        
        console.log(`✅ Upload: ${publicUrl}`);
        successCount++;

        // Limpar arquivos temporários
        fs.unlinkSync(filepath);
        fs.unlinkSync(compressedPath);

      } catch (err) {
        console.error(`❌ Erro ao processar imagem:`, err.message);
        errorCount++;
        
        // Limpar arquivos temporários se existirem
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
        const compressedPath = path.join(tempDir, `compressed-${filename}`);
        if (fs.existsSync(compressedPath)) {
          fs.unlinkSync(compressedPath);
        }
      }
    }

    // Limpar diretório temporário
    fs.rmdirSync(tempDir);

    console.log('\n📈 Resumo da migração de imagens:');
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`⏭️  Pulados: ${skipCount}`);
    console.log(`❌ Erros: ${errorCount}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
migrateImages();
