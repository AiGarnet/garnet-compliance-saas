"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/auth/login'
}) => {
  const { user, isLoading, isAuthenticated, hasAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      if (requiredRole && !hasAccess(requiredRole)) {
        // Redirect based on user role if they don't have access
        if (user?.role === 'enterprise') {
          router.push('/trust-portal');
        } else {
          router.push(fallbackPath);
        }
        return;
      }
    }
  }, [isLoading, isAuthenticated, hasAccess, requiredRole, router, user, fallbackPath]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have access
  if (!isAuthenticated || (requiredRole && !hasAccess(requiredRole))) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              {!isAuthenticated 
                ? "You need to sign in to access this page."
                : "You don't have permission to access this page."
              }
            </p>
            <button
              onClick={() => router.push(isAuthenticated ? (user?.role === 'enterprise' ? '/trust-portal' : '/dashboard') : '/auth/login')}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Higher-order component for easier usage
export const withAuth = (
  WrappedComponent: React.ComponentType<any>,
  requiredRole?: string | string[]
) => {
  return function AuthenticatedComponent(props: any) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}; 