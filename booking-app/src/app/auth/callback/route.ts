import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // User profile is automatically created by database trigger
      // No need for manual insertion here

      // Redirect to dashboard
      return NextResponse.redirect(`${origin}/quotes`);
    }

    // Log authentication error for debugging
    console.error('Auth callback error:', error);
  }

  // Return the user to login with error message
  return NextResponse.redirect(`${origin}/auth/login?error=Could not authenticate user`);
}