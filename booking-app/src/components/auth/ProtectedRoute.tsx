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
  const redirectTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Clear any existing redirect timer
    if (redirectTimer.current) {
      clearTimeout(redirectTimer.current);
    }

    // Prevent multiple redirects
    if (hasRedirected.current) return;

    // If still loading, don't redirect yet
    if (loading) return;

    // Check if user needs to be redirected to login
    if (requireAuth && !user) {
      // Add a small delay to prevent race conditions with middleware
      // and allow AuthProvider more time to resolve the session
      redirectTimer.current = setTimeout(() => {
        // Double-check user is still not authenticated
        if (!user && !hasRedirected.current) {
          hasRedirected.current = true;
          const returnUrl = pathname;
          console.log('🔐 ProtectedRoute: Redirecting to login from:', returnUrl);
          router.replace(`/auth/login?redirectTo=${encodeURIComponent(returnUrl)}`);
        }
      }, 500); // 500ms delay is safer for session synchronization
      return;
    }

    // Check role-based access
    if (user && allowedRoles && profile) {
      if (!allowedRoles.includes(profile.role as any)) {
        hasRedirected.current = true;
        router.replace('/unauthorized');
      }
    }

    // Clean up timer on unmount or when deps change
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, [user, profile, loading, requireAuth, allowedRoles, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-clio-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clio-blue mx-auto mb-6"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-clio-gray-400">Authenticating...</p>
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