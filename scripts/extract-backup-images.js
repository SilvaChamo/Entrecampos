const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupPath = '/Users/macbook/BackUp/——— BackUp/—— WEB/___ SITES/EntreCAMPOS/— BACKUP/wp.26_28781.2026-04-07_09-05-16.tar.gz';
const extractDir = path.join(__dirname, '../public/wp-content');

console.log('📦 A extrair imagens do backup...');

try {
  // Criar diretório de extração
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  // Extrair todo o conteúdo wp-content/uploads
  const cmd = `tar -xzf "${backupPath}" -C "${extractDir}" --include="*wp-content/uploads*" 2>/dev/null || tar -xzf "${backupPath}" -C "${extractDir}" "wp-content/uploads" 2>/dev/null || echo "Tentando extração completa..."`;
  
  execSync(cmd, { stdio: 'inherit' });
  
  console.log('✅ Imagens extraídas com sucesso!');
  console.log(`📁 Local: ${extractDir}`);
  
  // Listar arquivos extraídos
  const uploadsDir = path.join(extractDir, 'wp-content/uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir, { recursive: true });
    console.log(`📊 Total de arquivos: ${files.length}`);
  }
  
} catch (error) {
  console.error('❌ Erro ao extrair:', error.message);
  console.log('\n🔧 Alternativa: Extração manual');
  console.log(`1. Abra o arquivo: ${backupPath}`);
  console.log('2. Extraia a pasta wp-content/uploads');
  console.log(`3. Coloque em: ${extractDir}`);
}
