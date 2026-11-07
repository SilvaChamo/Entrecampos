import ExpShell from '@/components/Expnews/Shell';
import WeatherCard from '@/components/Expnews/WeatherCard';
import ExchangeCard from '@/components/Expnews/ExchangeCard';
import StickyColumn from '@/components/Expnews/StickyColumn';
import { SiteSidebar } from '@/components/Site/parts';
import PageHeaderCard, { type Crumb } from '@/components/Expnews/PageHeaderCard';

/**
 * Páginas interiores: o mesmo cabeçalho, menu lateral e rodapé da home.
 * Com `title` (e o caminho em `trail`) mostra o card de título no topo, igual em todas as páginas interiores.
 */
export default function InnerPage({
  children,
  backdrop,
  title,
  trail = [],
}: {
  children: React.ReactNode;
  backdrop?: string;
  title?: string;
  trail?: Crumb[];
}) {
  return (
    <ExpShell backdrop={backdrop}>
      <main className="pb-6">
        {title && <PageHeaderCard title={title} trail={trail} />}
        <div className="mx-3">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </div>
      </main>
    </ExpShell>
  );
}

/** Coluna lateral das páginas interiores (igual à da página de leitura): fica fixa ao fazer scroll. Com `exchange`, leva também o card de câmbio (página de leitura). */
export function InnerSidebar({ exchange = false }: { exchange?: boolean }) {
  return (
    <StickyColumn className="min-w-0 space-y-3">
      <WeatherCard />
      {exchange && <ExchangeCard />}
      <SiteSidebar facebook={false} />
    </StickyColumn>
  );
}
