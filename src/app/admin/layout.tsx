export const metadata = {
  title: 'Admin - EntreCAMPOS',
  description: 'Painel de administração',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simples layout sem autenticação por agora */}
      {children}
    </div>
  );
}
