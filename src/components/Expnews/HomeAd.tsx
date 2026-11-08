/**
 * Espaço de publicidade da página inicial: só aparece quando tem a imagem do anúncio (na medida do espaço). Sem imagem não
 * mostra nada; o convite a anunciar fica na página dos espaços de publicidade.
 */
export default function HomeAd({ image, link }: { image?: string; link?: string }) {
  if (!image) return null;
  const img = <img src={image} alt="Publicidade" loading="lazy" className="mx-auto block h-auto w-auto max-w-full" />;
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
