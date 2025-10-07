import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Debug: Log cookies being set
          console.log('[Middleware] Setting cookies:', cookiesToSet.map(c => ({ name: c.name, hasValue: !!c.value })));

          // Set cookies on both request and response without recreating the response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Debug: Log auth status
  console.log('[Middleware] Auth check - User:', user ? 'authenticated' : 'not authenticated', 'Path:', request.nextUrl.pathname);

  // Protected routes - all dashboard routes and admin
  const protectedPaths = ['/admin', '/dashboard'];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Auth routes (should not be accessible when logged in)
  const authPaths = ['/auth/login', '/auth/signup'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthPath && user) {
    // Check if there's a redirectTo parameter, otherwise default to /dashboard/quotes
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard/quotes';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return supabaseResponse;
}