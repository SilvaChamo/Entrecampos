import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Esta API simula a limpeza de cache do Next.js
// Em produção real, pode precisar de acesso ao servidor para reiniciar/rebuild

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;
    
    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de cache não especificado' },
        { status: 400 }
      );
    }
    
    // Diretórios do Next.js
    const nextDir = path.join(process.cwd(), '.next');
    
    let message = '';
    let success = true;
    
    switch (type) {
      case 'Static Generation':
        // Simular limpeza de páginas estáticas
        // Nota: Em produção real, isto requer rebuild
        message = 'Cache de páginas estáticas marcado para rebuild. Execute "npm run build" para recriar.';
        success = true;
        break;
        
      case 'ISR Cache':
        // Tentar limpar cache ISR
        const cacheDir = path.join(nextDir, 'cache');
        if (fs.existsSync(cacheDir)) {
          try {
            fs.rmSync(cacheDir, { recursive: true, force: true });
            message = 'Cache ISR limpo com sucesso!';
          } catch (e) {
            message = 'Não foi possível limpar o cache ISR (pode estar em uso).';
            success = false;
          }
        } else {
          message = 'Diretório de cache ISR não encontrado.';
        }
        break;
        
      case 'Image Optimization':
        // Limpar cache de imagens
        const imagesDir = path.join(nextDir, 'images');
        if (fs.existsSync(imagesDir)) {
          try {
            fs.rmSync(imagesDir, { recursive: true, force: true });
            message = 'Cache de imagens limpo com sucesso!';
          } catch (e) {
            message = 'Não foi possível limpar o cache de imagens.';
            success = false;
          }
        } else {
          message = 'Diretório de cache de imagens não encontrado.';
        }
        break;
        
      case 'Build Cache':
        // Limpar todo o diretório .next (requer rebuild)
        message = 'Para limpar o build cache completo, execute "rm -rf .next && npm run build"';
        success = true;
        break;
        
      case 'all':
        // Limpar todos os caches possíveis
        const clearedCaches: string[] = [];
        
        if (fs.existsSync(path.join(nextDir, 'images'))) {
          try {
            fs.rmSync(path.join(nextDir, 'images'), { recursive: true, force: true });
            clearedCaches.push('Imagens');
          } catch (e) {
            // ignore
          }
        }
        
        if (fs.existsSync(path.join(nextDir, 'cache'))) {
          try {
            fs.rmSync(path.join(nextDir, 'cache'), { recursive: true, force: true });
            clearedCaches.push('ISR');
          } catch (e) {
            // ignore
          }
        }
        
        if (clearedCaches.length > 0) {
          message = `Caches limpos: ${clearedCaches.join(', ')}. Páginas estáticas requerem rebuild.`;
        } else {
          message = 'Nenhum cache encontrado para limpar.';
        }
        break;
        
      default:
        return NextResponse.json(
          { error: `Tipo de cache desconhecido: ${type}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success,
      message,
      type,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar pedido de limpeza',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
