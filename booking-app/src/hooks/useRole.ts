import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Database } from '@/types/database-contacts';

type UserRole = Database['public']['Tables']['users']['Row']['role'];

interface RoleHookReturn {
  role: UserRole | null;
  isAdmin: boolean;
  isAgent: boolean;
  isClient: boolean;
  loading: boolean;
  error: string | null;
  refreshRole: () => Promise<void>;
}

export function useRole(): RoleHookReturn {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      setRole(data.role);
    } catch (err: any) {
      console.error('Failed to fetch user role:', err);
      setError(err.message || 'Failed to fetch role');
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  return {
    role,
    isAdmin: role === 'admin',
    isAgent: role === 'agent',
    isClient: role === 'client',
    loading,
    error,
    refreshRole: fetchRole,
  };
}
