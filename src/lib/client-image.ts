/**
 * Prepara uma foto no próprio navegador antes de a enviar: roda pela orientação, reduz o lado maior a `max` px e
 * grava em JPEG. Fotos já pequenas, GIF e SVG seguem como estão. Torna o envio rápido (centenas de KB, não dezenas de MB).
 */
export async function prepareImage(file: File, max = 2400, quality = 0.86): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 1_200_000 && file.type === 'image/jpeg') {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close(); return file; }
    ctx.fillStyle = '#fff'; // fundo branco para PNG com transparência
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size && scale === 1) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/**
 * Imagens da galeria (envio directo do navegador): converte para WebP com no máximo 100 KB, mantendo a qualidade (qualidade
 * 0,86 a 0,70 e, só se não couber, largura menor). Se o navegador não gravar WebP, ou não for uma imagem convertível
 * (GIF, SVG, vídeo, documentos), devolve o ficheiro como veio.
 */
export async function prepareWebp100(file: File, maxBytes = 100 * 1024): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    let width = Math.min(bitmap.width, 1600);
    for (let step = 0; step < 10; step++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.round((bitmap.height * width) / bitmap.width);
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const q of [0.86, 0.82, 0.78, 0.74, 0.7]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', q));
        if (!blob || blob.type !== 'image/webp') { bitmap.close(); return file; } // navegador sem WebP
        if (blob.size <= maxBytes) { bitmap.close(); return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }); }
      }
      width = Math.round(width * 0.9);
    }
    bitmap.close();
    return file;
  } catch {
    return file;
  }
}

export type CropRect = { x: number; y: number; width: number; height: number };

/**
 * Recorta uma foto no navegador (área em píxeis da foto original) e devolve o ficheiro novo, no mesmo formato (PNG, WebP ou JPEG).
 * Fotos de outro endereço só se recortam se esse servidor o permitir (CORS); senão lança erro.
 */
export async function cropImage(src: string, rect: CropRect, fileName = 'foto'): Promise<File> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('A foto demorou demasiado a carregar.')), 20000);
    img.onload = () => { clearTimeout(timer); resolve(); };
    img.onerror = () => { clearTimeout(timer); reject(new Error('Não foi possível carregar a foto para recortar.')); };
    // Sem o parâmetro o navegador reutiliza a cópia já carregada (sem CORS) e o recorte falha.
    img.src = /^(blob|data):/.test(src) ? src : `${src}${src.includes('?') ? '&' : '?'}crop=${Date.now()}`;
  });
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível recortar a foto.');
  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height);
  const path = src.split(/[?#]/)[0].toLowerCase();
  const type = /\.png$/.test(path) ? 'image/png' : /\.webp$/.test(path) ? 'image/webp' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.9));
  if (!blob) throw new Error('Não foi possível recortar a foto (a origem não permite).');
  const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `${fileName.replace(/\.[^.]+$/, '')}.${ext}`, { type });
}
