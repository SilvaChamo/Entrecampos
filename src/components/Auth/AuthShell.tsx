import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { AlertCircle } from 'lucide-react';

// Letra do modelo (Poppins), só nas páginas de entrada: login, registo e recuperar senha.
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] });

/** Formulário: no telemóvel tudo centrado e compacto; no computador alinhado à esquerda e com mais ar. */
export const AUTH_FORM = 'space-y-3 text-center md:space-y-5 md:text-left';

/** Botão principal (verde; vermelho ao passar o rato). */
export const AUTH_BUTTON =
  'flex h-[40px] min-w-[140px] items-center justify-center gap-2 bg-[#0f6e3a] px-6 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(15,110,58,0.35)] transition-colors hover:bg-[#d6101c] hover:shadow-[0_6px_14px_rgba(214,16,28,0.35)] disabled:opacity-70';

/** Link de texto sublinhado (vermelho ao passar o rato). */
export const AUTH_LINK = 'border-b border-[#1d1d1d] text-[#1d1d1d] transition-colors hover:border-[#d6101c] hover:text-[#d6101c]';

/** Campo: caixa branca com barra de cor à esquerda, brilho suave, ícone, traço vertical e texto em itálico. */
export function AuthField({ icon: Icon, label, ...props }: { icon: React.ElementType; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex h-[44px] items-center border-l-[4px] border-[#0f6e3a] bg-white text-left shadow-[0_0_16px_rgba(0,166,81,0.22)] md:h-[54px]">
      <Icon className="mx-3 h-5 w-5 shrink-0 text-gray-500" strokeWidth={1.5} />
      <span className="h-4 w-px shrink-0 bg-gray-400" />
      <input
        aria-label={label}
        placeholder={label}
        {...props}
        className="h-full min-w-0 flex-1 bg-transparent pl-3 pr-3 text-[13px] italic text-[#1d1d1d] outline-none placeholder:italic placeholder:text-gray-400"
      />
    </div>
  );
}

/** Mensagem de erro ou de sucesso por cima dos campos. */
export function AuthMessage({ error, info }: { error?: string | null; info?: string | null }) {
  return (
    <>
      {error && (
        <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-left text-[12px] text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {info && <div className="border border-green-200 bg-green-50 px-3 py-2 text-left text-[12px] text-green-800">{info}</div>}
    </>
  );
}

/**
 * Página de entrada com o desenho do modelo: cartão branco (logótipo + formulário) e cartão verde com boas-vindas e um botão
 * para a página vizinha. Serve o login, o registo e a recuperação da senha, para ficarem todos iguais.
 */
export default function AuthShell({
  children,
  title,
  text,
  href,
  label,
}: {
  children: React.ReactNode;
  title: string;
  text: string;
  href: string;
  label: string;
}) {
  return (
    <div className={`${poppins.className} [&_*]:[font-family:inherit] relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f9] px-2 py-10 md:px-4`}>
      {/* Círculos de degradé nos cantos, como no modelo */}
      <span className="pointer-events-none absolute -left-[90px] -top-[100px] h-[220px] w-[220px] rounded-full bg-gradient-to-br from-[#00a651] to-[#0b5a2e]" />
      <span className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[170px] w-[170px] rounded-full bg-gradient-to-br from-[#0f6e3a] to-[#063d1f]" />

      <div className="relative flex w-full max-w-[860px] flex-col items-center md:flex-row md:items-stretch md:justify-center">
        {/* Cartão branco: logótipo e formulário */}
        <div className="relative z-10 w-full max-w-[400px] bg-white px-3 pb-5 pt-4 shadow-[0_10px_40px_rgba(0,0,0,0.12)] md:w-[400px] md:shrink-0 md:px-8 md:pb-12 md:pt-9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="EntreCAMPOS" className="mx-auto mb-4 h-10 w-auto md:mb-10 md:h-12" />
          {children}
        </div>

        {/* Cartão verde: ondas em degradé, boas-vindas e botão para a página vizinha; passa por baixo do cartão branco.
            Acompanha a altura do cartão branco: sobra sempre 60px por cima e por baixo (margem negativa), seja qual for o formulário. */}
        <div className="relative mt-4 w-full max-w-[400px] overflow-hidden bg-gradient-to-br from-[#0b7a3c] via-[#0f6e3a] to-[#0a5a2f] shadow-[0_10px_40px_rgba(0,0,0,0.18)] md:-my-[60px] md:-ml-[36px] md:w-[440px] md:max-w-none md:shrink-0">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 560" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ecg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00a651" stopOpacity="0.55" /><stop offset="1" stopColor="#0f6e3a" stopOpacity="0.1" /></linearGradient>
              <linearGradient id="ecg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#063d1f" stopOpacity="0.75" /><stop offset="1" stopColor="#0f6e3a" stopOpacity="0.1" /></linearGradient>
            </defs>
            <path d="M60 0 C 40 120 150 150 230 200 C 330 262 420 210 440 90 L 440 0 Z" fill="url(#ecg1)" />
            <path d="M0 330 C 90 300 180 360 250 420 C 320 480 400 440 440 380 L 440 560 L 0 560 Z" fill="url(#ecg2)" />
            <path d="M0 150 C 40 160 55 230 20 290 C 10 305 0 300 0 290 Z" fill="#00a651" fillOpacity="0.35" />
            <path d="M440 280 C 405 290 395 350 440 380 Z" fill="#00a651" fillOpacity="0.35" />
          </svg>
          <div className="relative flex h-full min-h-[300px] flex-col items-center justify-center px-8 py-14 text-center text-white md:pl-14">
            <h2 className="text-[18px] font-bold uppercase tracking-wide">{title}</h2>
            <p className="mt-2 max-w-[300px] text-[12px] leading-relaxed">{text}</p>
            <Link
              href={href}
              className="mt-8 flex h-[40px] min-w-[110px] items-center justify-center bg-[#063d1f]/70 px-6 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#d6101c]"
            >
              {label}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
