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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

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
      console.error('❌ fetchProfile: Caught exception:', error);
      return null;
    }
  };

  // Initialize auth once on mount with consolidated logic
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      console.log('🔷 AuthProvider: Initializing auth state...');
      try {
        // First try to get existing session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error('❌ AuthProvider: Error getting initial session:', error);
        }

        if (initialSession) {
          console.log('✅ AuthProvider: Found initial session');
          setSession(initialSession);
          setUser(initialSession.user ?? null);
          
          const profileData = await fetchProfile(initialSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        } else {
          console.log('ℹ️ AuthProvider: No initial session found');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Unexpected error during auth init:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

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
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          const profileData = await fetchProfile(newSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        // Handled by getSession call above, but update if we have a session now
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user ?? null);
          const profileData = await fetchProfile(newSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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