import ExpShell from '@/components/Expnews/Shell';
import WeatherCard from '@/components/Expnews/WeatherCard';
import FacebookPage from '@/components/Expnews/FacebookPage';
import { SiteSidebar } from '@/components/Site/parts';

/** Páginas interiores: o mesmo cabeçalho, menu lateral e rodapé da home. */
export default function InnerPage({ children, backdrop }: { children: React.ReactNode; backdrop?: string }) {
  return (
    <ExpShell backdrop={backdrop}>
      <main className="mx-3 pb-6">
        <div className="mx-auto max-w-[1280px]">{children}</div>
      </main>
    </ExpShell>
  );
}

/** Coluna lateral das páginas interiores (igual à da página de leitura). */
export function InnerSidebar() {
  return (
    <div className="min-w-0 space-y-6">
      <WeatherCard />
      <FacebookPage />
      <SiteSidebar facebook={false} />
    </div>
  );
}
