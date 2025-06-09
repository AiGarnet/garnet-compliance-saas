import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

export function useAuthGuard(requiredRole?: string | string[]) {
  const { user, isAuthenticated, isLoading, hasAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (requiredRole && !hasAccess(requiredRole)) {
        // Redirect based on user role if they don't have access
        if (user?.role === 'enterprise') {
          router.push('/trust-portal');
        } else {
          router.push('/dashboard');
        }
        return;
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, requiredRole, router, user]);

  return {
    isLoading,
    isAuthenticated,
    user,
    hasAccess: (role?: string | string[]) => hasAccess(role)
  };
} 