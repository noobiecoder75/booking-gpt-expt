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

  useEffect(() => {
    const initAuth = async () => {
      console.log('🔷 AuthProvider: Initializing...');
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔷 AuthProvider: Session retrieved:', session ? 'Found' : 'Not found');
        console.log('🔷 AuthProvider: User:', session?.user?.email || 'No user');

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('🔷 AuthProvider: Fetching profile for user:', session.user.id);
          const profileData = await fetchProfile(session.user.id);
          console.log('🔷 AuthProvider: Profile fetched:', profileData ? 'Success' : 'Failed');
          console.log('🔷 AuthProvider: Profile data:', profileData);
          setProfile(profileData);
        } else {
          console.log('🔷 AuthProvider: No user session, skipping profile fetch');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Error initializing auth:', error);
      } finally {
        console.log('🔷 AuthProvider: Loading complete, setting loading=false');
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 AuthProvider: Auth state changed, event:', event);
      console.log('🔔 AuthProvider: New session:', session ? 'Found' : 'Not found');

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('🔔 AuthProvider: Fetching profile after state change');
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        console.log('🔔 AuthProvider: Clearing profile (no session)');
        setProfile(null);
      }

      console.log('🔔 AuthProvider: State change complete, setting loading=false');
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    try {
      console.log('🔄 AuthProvider: Starting signOut');

      // Sign out with local scope (clears cookies properly)
      const { error } = await supabase.auth.signOut({ scope: 'local' });

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