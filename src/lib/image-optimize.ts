import sharp from 'sharp';

/** Limite de peso de cada imagem do site. */
export const MAX_IMAGE_BYTES = 100 * 1024;

/**
 * Converte uma imagem para WebP com no máximo 100 KB, mantendo a qualidade: tenta qualidades de 86 a 70 e, só se ainda
 * não couber, reduz a largura 10 % de cada vez (nunca passa de 1600 px de largura). Respeita a orientação da câmara.
 */
export async function toWebp100(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  let width = Math.min(meta.width || 1600, 1600);
  for (let step = 0; step < 10; step++) {
    for (const quality of [86, 82, 78, 74, 70]) {
      const out = await sharp(input).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
      if (out.length <= MAX_IMAGE_BYTES) return out;
    }
    width = Math.round(width * 0.9);
  }
  return sharp(input).rotate().resize({ width: 600, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
}
