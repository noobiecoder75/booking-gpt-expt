'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const fetchProfile = async (userId: string) => {
    console.log('🔍 fetchProfile: Starting for userId:', userId);
    try {
      // 3 second timeout for the profile query
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Race the query against the timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error('❌ fetchProfile: Error from Supabase:', error);
        console.error('❌ fetchProfile: Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        return null;
      }

      console.log('✅ fetchProfile: Successfully fetched data:', data);
      return data;
    } catch (error) {
      console.error('❌ fetchProfile: Profile fetch failed or timed out:', error);
      return null;
    }
  };

  // Initialize auth once on mount with consolidated logic
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      console.log('🔷 AuthProvider: Initializing auth state...');
      try {
        // Small delay to allow browser to settle cookies after redirect
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // First try to get existing session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ AuthProvider: Error getting initial session:', error);
        }

        if (initialSession) {
          console.log('✅ AuthProvider: Found initial session for user:', initialSession.user.email);
          setSession(initialSession);
          setUser(initialSession.user ?? null);
          
          // Background fetch profile without blocking
          fetchProfile(initialSession.user.id).then(profileData => {
            if (mounted) {
              setProfile(profileData);
            }
          });
        } else {
          console.log('ℹ️ AuthProvider: No initial session found');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Unexpected error during auth init:', error);
      } finally {
        if (mounted) {
          console.log('🔷 AuthProvider: Loading finished, setting loading=false');
          setLoading(false);
        }
      }
    };

    // Set a safety timeout to ensure loading never gets stuck
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ AuthProvider: Timeout reached, forcing loading=false');
        setLoading(false);
      }
    }, 5000); // 5 second safety timeout

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('🔔 AuthProvider: Auth state change event:', event);
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        console.log('✅ AuthProvider: User authenticated via', event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Immediately set loading to false so the UI can render
        setLoading(false);

        if (newSession?.user) {
          // Background fetch profile without blocking
          fetchProfile(newSession.user.id).then(profileData => {
            if (mounted) {
              setProfile(profileData);
            }
          });
        }
      } else if (event === 'INITIAL_SESSION') {
        if (newSession) {
          console.log('✅ AuthProvider: Initial session detected');
          setSession(newSession);
          setUser(newSession.user ?? null);
          
          // Background fetch profile without blocking
          fetchProfile(newSession.user.id).then(profileData => {
            if (mounted) {
              setProfile(profileData);
            }
          });
        }
        setLoading(false);
      }
    });

    initAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Run once on mount

  const signOut = async () => {
    try {
      console.log('🔄 AuthProvider: Starting signOut');

      // Sign out globally (clears both client and server sessions)
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ AuthProvider: signOut error:', error);
        // Continue with cleanup even if signOut fails
      }

      // Clear all state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Clear local/session storage
      try {
        const STORAGE_KEYS = [
          'quote-store-supabase',
          'contact-store-supabase',
          'rate-store-supabase',
          'settings-store',
          'sidebar-store',
        ];

        STORAGE_KEYS.forEach(key => {
          localStorage.removeItem(key);
        });

        sessionStorage.clear();
        console.log('✅ AuthProvider: Storage cleared');
      } catch (storageError) {
        console.error('❌ AuthProvider: Error clearing storage:', storageError);
      }

      console.log('✅ AuthProvider: signOut completed');
    } catch (error) {
      console.error('❌ AuthProvider: signOut exception:', error);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};