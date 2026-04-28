'use client';
import { useSearchParams } from 'next/navigation';
import DashboardContent from '@/components/Admin/DashboardContent';
import RolePreviewPanel from '@/components/Admin/RolePreviewPanel';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  // Se tiver parâmetro role, mostra o painel de preview daquela role
  if (role === 'editor' || role === 'contribuidor' || role === 'guest') {
    return (
      <div className="p-6 h-full">
        <RolePreviewPanel role={role} />
      </div>
    );
  }

  // Senão, mostra o dashboard normal
  return <DashboardContent forcedRole="admin" />;
}
