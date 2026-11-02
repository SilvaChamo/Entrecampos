/**
 * Copia para a galeria (bucket entrecampos-media, pasta news/) as fotos de notícias que estão noutro bucket
 * (public-assets) e actualiza o image_url dessas notícias. Os originais NÃO são apagados.
 *
 *   node scripts/migrar-imagens-noticias.js           # só mostra o que faria (simulação)
 *   node scripts/migrar-imagens-noticias.js --apply   # copia e actualiza
 *
 * Em --apply guarda scripts/migracao-imagens-mapa.json (url antigo -> novo) para se poder reverter.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local'), quiet: true });
const { createClient } = require('@supabase/supabase-js');

const SITE = process.env.NEXT_PUBLIC_SITE_ID || 'entrecampos';
const FROM = 'public-assets';
const TO = process.env.NEXT_PUBLIC_STORAGE_BUCKET || process.env.STORAGE_BUCKET || 'entrecampos-media';
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: rows, error } = await sb.from('news').select('id,slug,image_url').eq('site_id', SITE).like('image_url', `%/public/${FROM}/%`);
  if (error) throw error;
  console.log(`${rows.length} notícias com foto em ${FROM}${APPLY ? '' : ' (simulação, nada é alterado)'}`);
  const map = [];
  for (const r of rows) {
    const rel = decodeURIComponent(r.image_url.split(`/public/${FROM}/`)[1].split('?')[0]);
    const dest = 'news/' + rel.split('/').pop().replace(/[^\w.\-]/g, '_');
    console.log(` ${r.slug}: ${FROM}/${rel} -> ${TO}/${dest}`);
    if (!APPLY) continue;
    const { data: blob, error: de } = await sb.storage.from(FROM).download(rel);
    if (de) { console.log('  FALHA download:', de.message); continue; }
    const { error: ue } = await sb.storage.from(TO).upload(dest, Buffer.from(await blob.arrayBuffer()), { contentType: blob.type || undefined, upsert: false });
    if (ue && !/already exists|Duplicate/i.test(ue.message)) { console.log('  FALHA upload:', ue.message); continue; }
    map.push({ id: r.id, old: r.image_url, new: sb.storage.from(TO).getPublicUrl(dest).data.publicUrl });
  }
  if (!APPLY) return;
  fs.writeFileSync(path.resolve(__dirname, 'migracao-imagens-mapa.json'), JSON.stringify(map, null, 2));
  for (const m of map) {
    const { error: e } = await sb.from('news').update({ image_url: m.new }).eq('id', m.id).eq('site_id', SITE);
    if (e) console.log('FALHA update', m.id, e.message);
  }
  console.log(`${map.length} fotos copiadas e notícias actualizadas.`);
})();
