'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppNav } from '@/components/navigation/AppNav';

interface ProtectedRouteProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  requireAuth?: boolean;
  allowedRoles?: Array<'admin' | 'agent' | 'client'>;
}

export function ProtectedRoute({
  children,
  showNavigation = false,
  requireAuth = true,
  allowedRoles
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return;

    if (!loading && requireAuth && !user) {
      hasRedirected.current = true;
      const returnUrl = pathname;
      router.replace(`/auth/login?redirectTo=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Check role-based access
    if (!loading && user && allowedRoles && profile) {
      if (!allowedRoles.includes(profile.role as any)) {
        hasRedirected.current = true;
        router.replace('/unauthorized');
      }
    }
  }, [user, profile, loading, requireAuth, allowedRoles, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      {showNavigation && <AppNav />}
      <div className={showNavigation ? "pt-16" : ""}>
        {children}
      </div>
    </>
  );
}