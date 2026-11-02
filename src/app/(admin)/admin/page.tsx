'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/Common/Spinner';

export default function AdminPageRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      // Redirect based on role
      switch (user.role) {
        case 'admin':
          router.push('/admin/dashboard');
          break;
        case 'editor':
          router.push('/admin/editor');
          break;
        case 'contribuidor':
          router.push('/admin/contribuidor');
          break;
        case 'guest':
          router.push('/admin/guest');
          break;
        default:
          router.push('/admin/dashboard');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center">
      <Spinner size={48} />
    </div>
  );
}
