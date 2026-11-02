import ExpShell from '@/components/Expnews/Shell';
import WeatherCard from '@/components/Expnews/WeatherCard';
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
      <main className="mx-3 pb-6">
        <div className="mx-auto max-w-[1280px]">
          {title && <PageHeaderCard title={title} trail={trail} />}
          {children}
        </div>
      </main>
    </ExpShell>
  );
}

/** Coluna lateral das páginas interiores (igual à da página de leitura): fica fixa ao fazer scroll. */
export function InnerSidebar() {
  return (
    <StickyColumn className="min-w-0 space-y-3">
      <WeatherCard />
      <SiteSidebar facebook={false} />
    </StickyColumn>
  );
}
