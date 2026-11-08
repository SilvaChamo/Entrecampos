import Link from 'next/link';

/**
 * Espaço de publicidade da página inicial. Com imagem, mostra o anúncio (e leva à ligação do anunciante); sem imagem,
 * mostra o convite a anunciar, que leva à página dos espaços de publicidade do site.
 */
export default function HomeAd({ image, link }: { image?: string; link?: string }) {
  if (image) {
    const img = <img src={image} alt="Publicidade" loading="lazy" className="block h-auto w-full" />;
    return (
      <div className="overflow-hidden bg-white shadow-sm">
        {link ? (
          <a href={link} target={/^https?:/i.test(link) ? '_blank' : undefined} rel="sponsored noopener noreferrer" className="block">
            {img}
          </a>
        ) : (
          img
        )}
      </div>
    );
  }
  return (
    <Link href="/espacos-de-publicidade?ver=site" className="flex min-h-[120px] flex-col items-center justify-center gap-1 border border-dashed border-[#d6101c] bg-white p-4 text-center">
      <span className="text-[13px] text-[#1d2327]">Espaço de publicidade</span>
      <span className="text-[12px] text-[#d6101c]">Anuncie aqui</span>
    </Link>
  );
}
