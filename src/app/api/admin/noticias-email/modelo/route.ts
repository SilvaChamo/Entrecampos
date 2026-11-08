import { NextResponse } from 'next/server';
import { zipSync, strToU8 } from 'fflate';
import { requireAuth } from '@/lib/api-guard';
import { applyCategoryNames, getCategoryOptions } from '@/lib/news-data';
import { mailAddress } from '@/lib/redaccao-mail';

export const dynamic = 'force-dynamic';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const para = (label: string, value = '') =>
  `<w:p><w:r>${label ? `<w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${esc(label)} </w:t></w:r><w:r>` : ''}<w:t xml:space="preserve">${esc(value)}</w:t></w:r></w:p>`;
const gap = '<w:p/>';

/** Modelo de Word para enviar notícias por e-mail: um bloco por notícia, cada um começa em «Título:». */
export async function GET() {
  const guard = await requireAuth('publicar_artigos');
  if ('error' in guard) return guard.error;
  await applyCategoryNames();
  const categories = (await getCategoryOptions()).map((c) => c.label);
  const [first = 'Notícias', second = first] = categories;
  const body = [
    para('', `Modelo de notícias por e-mail (enviar para ${mailAddress()}). Apague estas linhas e, para cada notícia, preencha os campos. Cada notícia começa em «Título:». Para pôr a foto, cole-a no documento (por baixo de «Foto:») ou escreva o nome do ficheiro anexado ao e-mail. Sem foto, a notícia fica nos pendentes. Sem data, publica logo; com data (dd/mm/aaaa hh:mm), fica agendada.`),
    para('', `Categorias do site: ${categories.join(', ')}. Se a categoria não for uma destas, a notícia fica nos pendentes.`),
    gap,
    para('Título:', 'Exemplo: Título da notícia'),
    para('Categoria:', first),
    para('Descrição:', 'Resumo curto da notícia, numa ou duas frases.'),
    para('Foto:', 'foto-exemplo.jpg'),
    para('Data:', '15/12/2026 08:00'),
    para('Texto:', 'Primeiro parágrafo da notícia.'),
    para('', 'Segundo parágrafo, e assim por diante.'),
    gap,
    para('Título:', 'Segunda notícia do mesmo documento'),
    para('Categoria:', second),
    para('Descrição:', 'Outro resumo.'),
    para('Texto:', 'Texto da segunda notícia.'),
  ].join('');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const zip = zipSync({
    '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
    '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
    'word/document.xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`),
  });
  return new NextResponse(Buffer.from(zip), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="modelo-noticias-por-email.docx"',
    },
  });
}
