import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('🔄 Logout route: Starting server-side logout');

  const supabase = await createClient();

  try {
    // Sign out with local scope to clear cookies properly
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) {
      console.error('❌ Logout route: Supabase signOut error:', error);
      // Continue with redirect even if signOut fails
    } else {
      console.log('✅ Logout route: Server-side logout successful');
    }
  } catch (error) {
    console.error('❌ Logout route: Exception during logout:', error);
  }

  // Create response with cleared cookies
  const response = NextResponse.redirect(new URL('/auth/login', request.url));

  // Clear auth cookies explicitly
  response.cookies.delete('sb-access-token');
  response.cookies.delete('sb-refresh-token');

  console.log('🔀 Logout route: Redirecting to login');

  return response;
}

// Also support GET for direct navigation
export async function GET(request: Request) {
  return POST(request);
}