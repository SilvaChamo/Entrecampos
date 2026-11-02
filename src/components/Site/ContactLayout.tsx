import { Mail, MapPin, Phone } from 'lucide-react';
import ContactForm from '@/components/Forms/ContactForm';

const ADDRESS = 'Av. Kar Marx nº 177, Maputo';
const MAP_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(`${ADDRESS}, Moçambique`)}&z=15&output=embed`;

const ITEMS = [
  { icon: MapPin, title: 'Localização', links: [{ text: ADDRESS }, { text: 'Moçambique' }] },
  {
    icon: Phone,
    title: 'Telefone',
    links: [
      { text: '+258 82 52 88 38', href: 'tel:+25882528838' },
      { text: '+258 85 73 96 739', href: 'tel:+258857396739' },
    ],
  },
  {
    icon: Mail,
    title: 'Email',
    links: [
      { text: 'suporte@entrecamposblog.com', href: 'mailto:suporte@entrecamposblog.com' },
      { text: 'redação@entrecamposblog.com' },
    ],
  },
];

/** Página de contactos: apresentação e dados à esquerda, formulário à direita e mapa em baixo. */
export default function ContactLayout() {
  return (
    <div className="space-y-6">
      <section className="grid gap-8 bg-white p-6 shadow-sm sm:p-10 lg:grid-cols-[0.8fr_1.4fr] lg:gap-10">
        <div>
          <h2 className="text-[26px] font-extrabold leading-tight text-[#0c1f08]">Estamos aqui para o ajudar</h2>
          <p className="mt-3 text-[13px] leading-6 text-gray-600">
            Tem uma notícia, uma sugestão ou quer anunciar no EntreCAMPOS? Fale connosco pelos contactos abaixo
            ou envie-nos uma mensagem pelo formulário e responderemos o mais depressa possível.
          </p>
          <ul className="mt-8 space-y-6">
            {ITEMS.map(({ icon: Icon, title, links }) => (
              <li key={title} className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#d6101c]">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-[16px] font-bold text-[#0c1f08]">{title}</h3>
                  {links.map(({ text, href }) =>
                    href ? (
                      <a key={text} href={href} className="block text-[13px] text-gray-600 hover:text-[#d6101c]">{text}</a>
                    ) : (
                      <p key={text} className="text-[13px] text-gray-600">{text}</p>
                    ),
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-100 p-6 sm:p-8">
          <ContactForm embedded />
        </div>
      </section>

      <section className="overflow-hidden bg-white p-2 shadow-sm">
        <iframe
          title={`Mapa: ${ADDRESS}`}
          src={MAP_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block h-[360px] w-full border-0"
        />
      </section>
    </div>
  );
}
