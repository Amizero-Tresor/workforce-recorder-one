'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PageLoading } from '@/components/ui/LazyComponent';

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        if (user.role === 'WORKER') {
          router.push('/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      } else {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  return <PageLoading />;
}