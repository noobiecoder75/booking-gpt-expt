import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Create a Supabase client for browser use with proper session management
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Enable automatic token refresh
        autoRefreshToken: true,
        // Persist session in localStorage
        persistSession: true,
        // Detect session from URL (for OAuth callbacks)
        detectSessionInUrl: true,
        // Use PKCE flow for enhanced security
        flowType: 'pkce',
      },
      // Enable realtime for auth state changes
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );
}

// Singleton instance for client components
let browserClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}