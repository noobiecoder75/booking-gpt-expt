import { useQuery } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export function useInvoicesQuery() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useInvoicesByCustomerQuery(customerId: string | undefined) {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ['invoices', user?.id, 'customer', customerId],
    queryFn: async () => {
      if (!user || !customerId) throw new Error('Missing required data');

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false});

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!customerId,
  });
}
