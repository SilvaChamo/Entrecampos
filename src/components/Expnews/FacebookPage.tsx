import { FACEBOOK_URL, SectionHeading } from '@/components/Site/parts';
import { Facebook } from 'lucide-react';

/** Página oficial do EntreCAMPOS no Facebook (linha do tempo: posts mais recentes primeiro). */
export default function FacebookPage() {
  return (
    <section className="ec-reveal bg-white p-5 shadow-sm">
      <SectionHeading>Siga-nos</SectionHeading>
      <iframe
        title="Página de Facebook do EntreCAMPOS"
        src={`https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(FACEBOOK_URL)}&tabs=timeline&width=260&height=500&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true`}
        width="260"
        height="500"
        loading="lazy"
        allow="encrypted-media"
        className="mt-4 block w-full border-0 bg-white"
      />
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-between bg-[#3b5998] px-3 py-[10px] text-[11px] font-bold text-white hover:opacity-90"
      >
        <span className="flex items-center gap-2">
          <Facebook className="h-3.5 w-3.5" />
          Abrir no Facebook
        </span>
        <span className="uppercase">Gostar</span>
      </a>
    </section>
  );
}
