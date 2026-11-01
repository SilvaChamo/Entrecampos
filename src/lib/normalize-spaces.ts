/**
 * Troca espaços "duros" (&nbsp; / U+00A0) por espaços normais, para o texto poder quebrar linha.
 * Parágrafos que só têm um espaço duro (linha em branco do editor) ficam como estão.
 */
export function normalizeSpaces(html: string): string {
  return (html || '').replace(/&nbsp;| /g, (match, offset: number, source: string) => {
    const aloneInTag = source[offset - 1] === '>' && source[offset + match.length] === '<';
    return aloneInTag ? match : ' ';
  });
}
